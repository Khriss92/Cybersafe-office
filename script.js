const appState = {
  score: 0,
  risk: 0,
  started: false,
  currentTask: 0,
  correctCount: 0,
  mistakes: 0,
  soundEnabled: true,
  audioContext: null,
  participantName: "",
  serverStatus: "Not submitted yet",
  submissionSaved: false,
  sessionStartedAt: null,
  sessionFinishedAt: null,
  sessionDurationSeconds: 0,
  totalRetries: 0,
  taskAttemptCounts: {},
  taskResults: [],
  phishing: {
    selectedId: null,
    zones: { safe: [], report: [] },
  },
  password: {
    parts: [],
  },
  device: {
    update: false,
    scan: false,
    firewall: false,
    muteWarnings: false,
  },
  ids: {
    selected: new Set(),
  },
  ips: {
    selectedIp: null,
    selectedAction: null,
  },
  fail2ban: {
    enabled: false,
    locked: false,
    threshold: null,
  },
  usb: {
    selectedItem: null,
    quarantinedId: null,
  },
  mfa: {
    deny: false,
    report: false,
    approve: false,
  },
  wifi: {
    choice: null,
    vpnEnabled: false,
  },
  screenLock: {
    choice: null,
  },
  dataSort: {
    selectedId: null,
    zones: { public: [], internal: [], confidential: [] },
  },
  browsing: {
    selectedSite: null,
  },
  backup: {
    selected: new Set(),
  },
  incident: {
    sequence: [],
  },
};

const scoreValue = document.getElementById("scoreValue");
const riskValue = document.getElementById("riskValue");
const taskValue = document.getElementById("taskValue");
const streakValue = document.getElementById("streakValue");
const mistakeValue = document.getElementById("mistakeValue");
const riskFill = document.getElementById("riskFill");
const riskLabel = document.getElementById("riskLabel");
const riskSummary = document.getElementById("riskSummary");
const eventLog = document.getElementById("eventLog");
const sceneContainer = document.getElementById("sceneContainer");
const soundToggle = document.getElementById("soundToggle");
const storyPanel = document.querySelector(".story-panel");

const riskStates = [
  { max: 19, label: "Stable", summary: "Good choices are keeping the company calm." },
  { max: 39, label: "Elevated", summary: "There is some risk, but the situation is still manageable." },
  { max: 69, label: "Danger Zone", summary: "Too many weak decisions are creating openings for attackers." },
  { max: 100, label: "Breach Imminent", summary: "The company is close to a serious security incident." },
];

const phishingEmails = [
  {
    id: "safe-payroll",
    from: "Payroll <payroll@company.com>",
    subject: "Updated payslip available",
    body: "Your March payslip is now in the employee portal.",
  },
  {
    id: "phishing",
    from: "IT-Support <it-support@company-security.com>",
    subject: "Reset password immediately",
    body: "Click in 10 minutes or your company account will be suspended.",
  },
  {
    id: "safe-facilities",
    from: "Facilities <facilities@company.com>",
    subject: "Meeting room projector maintenance",
    body: "Aspen Room projector is offline until 2 PM.",
  },
];

const usbItems = [
  {
    id: "mystery-usb",
    title: "Unknown USB drive labeled Salaries 2026",
    body: "Found outside with no owner or company label.",
  },
  {
    id: "security-key",
    title: "Approved security key",
    body: "Issued by IT and clearly marked with a company asset tag.",
  },
  {
    id: "headset-dongle",
    title: "Headset dongle from company box",
    body: "Still sealed inside approved office equipment packaging.",
  },
];

const documentItems = [
  {
    id: "doc-public",
    title: "Published company brochure",
    body: "Marketing material already approved for public sharing.",
  },
  {
    id: "doc-internal",
    title: "Weekly team meeting notes",
    body: "Useful for staff, but not meant for public release.",
  },
  {
    id: "doc-confidential",
    title: "Payroll spreadsheet with salaries",
    body: "Contains sensitive employee information.",
  },
];

const websiteOptions = [
  {
    id: "safe-portal",
    title: "https://portal.company.com",
    body: "Official company portal with HTTPS and correct domain spelling.",
    clue: "Correct spelling, secure connection, and familiar company domain.",
  },
  {
    id: "fake-portal",
    title: "http://portal-company-login.com",
    body: "Looks convincing, but uses a different domain and no secure connection.",
    clue: "Different domain pattern and no HTTPS padlock.",
  },
  {
    id: "lookalike-portal",
    title: "https://porta1.company.com",
    body: "Uses a lookalike character in the site name.",
    clue: "The letter l has been replaced with the number 1.",
  },
];

const backupOptions = [
  { id: "copy-cloud", title: "Keep a cloud backup", body: "Store a protected copy outside the main device." },
  { id: "copy-external", title: "Keep an external backup copy", body: "A second separate backup helps recovery." },
  { id: "regular-schedule", title: "Use a regular backup schedule", body: "Backups only help if they happen consistently." },
  { id: "same-laptop-only", title: "Save everything only on the same laptop", body: "One device alone is not enough." },
  { id: "never-test", title: "Never test the backups", body: "Untested backups may fail when needed." },
];

const incidentSteps = [
  { id: "report-it", title: "Report the lost device to IT/security", body: "Tell the right team immediately." },
  { id: "secure-account", title: "Change password or revoke access", body: "Reduce the risk of account misuse." },
  { id: "share-details", title: "Provide time, place, and device details", body: "Help the response team investigate." },
  { id: "follow-help", title: "Follow IT guidance and next steps", body: "Complete the formal response process." },
];

const TASKS = [
  {
    id: "phishing",
    name: "Phishing",
    render: renderPhishingTask,
    lesson: {
      correctAction: "Move the fake password reset email into the Security Report lane.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "The message uses urgency and a lookalike support domain. Reporting suspicious email is safer than clicking or ignoring it.",
    },
    successTitle: "Inbox secured",
    failTitle: "Inbox not handled safely",
    successDescription: "You sorted the suspicious email correctly and protected the user inbox.",
    failDescription: "The fake email was not handled the safest way.",
    successLog: "Suspicious email reported before anyone clicked it.",
    failLog: "Unsafe email handling left a phishing message active.",
  },
  {
    id: "password",
    name: "Password Strength",
    render: renderPasswordTask,
    lesson: {
      correctAction: "Build a long password with uppercase, lowercase, numbers, and symbols.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Long mixed passwords are much harder to guess or brute-force than short common words like company or password.",
    },
    successTitle: "Strong password created",
    failTitle: "Weak password chosen",
    successDescription: "The account now has a stronger password.",
    failDescription: "The password is still too predictable or too simple.",
    successLog: "A strong password was created for the account.",
    failLog: "The new password remained weak.",
  },
  {
    id: "device",
    name: "Device Security",
    render: renderDeviceTask,
    lesson: {
      correctAction: "Install the update, run a scan, and keep the firewall enabled.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Updates fix known problems, antivirus checks for threats, and firewalls reduce exposure. Disabling warnings or firewalls weakens protection.",
    },
    successTitle: "Workstation secured",
    failTitle: "Workstation left vulnerable",
    successDescription: "The device received the right protection steps.",
    failDescription: "Important device protections were skipped or weakened.",
    successLog: "The workstation received patching and layered protection.",
    failLog: "The workstation was not secured correctly.",
  },
  {
    id: "ids",
    name: "IDS Detection",
    render: renderIdsTask,
    lesson: {
      correctAction: "Select the failed login and suspicious admin attempt alerts.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "An IDS helps people notice suspicious patterns. Multiple failed logins and risky admin attempts are stronger warning signs than normal office activity.",
    },
    successTitle: "Suspicious activity detected",
    failTitle: "Real alert was missed",
    successDescription: "The important alerts were picked out from the noise.",
    failDescription: "The wrong events were selected from the alert stream.",
    successLog: "The suspicious IDS alerts were escalated correctly.",
    failLog: "The alert review missed the correct suspicious events.",
  },
  {
    id: "ips",
    name: "IPS Prevention",
    render: renderIpsTask,
    lesson: {
      correctAction: "Select the hostile IP and choose Block source IP.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "IPS is about stopping a known threat. Once the attack source is identified, blocking it is safer than only watching it.",
    },
    successTitle: "Hostile source blocked",
    failTitle: "Threat not blocked correctly",
    successDescription: "The right prevention move was used against the attacker.",
    failDescription: "The chosen response did not stop the real threat.",
    successLog: "The attack source was blocked correctly.",
    failLog: "The prevention step did not stop the attacker.",
  },
  {
    id: "fail2ban",
    name: "Fail2Ban",
    render: renderFail2banTask,
    lesson: {
      correctAction: "Enable Fail2Ban, lock the account, and choose a sensible threshold of 5 retries.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Automatic blocking works best when paired with immediate account protection. A sensible threshold helps stop brute-force attempts early.",
    },
    successTitle: "Brute-force attack contained",
    failTitle: "Brute-force response incomplete",
    successDescription: "The repeated failed logins were handled with a layered response.",
    failDescription: "The brute-force attempt was not fully contained.",
    successLog: "Fail2Ban and account protection were applied correctly.",
    failLog: "The failed-login response was incomplete.",
  },
  {
    id: "usb",
    name: "USB Safety",
    render: renderUsbTask,
    lesson: {
      correctAction: "Choose the unknown USB and quarantine it.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Unknown removable devices can contain malware. The safest action is to hand them to IT or security instead of plugging them in.",
    },
    successTitle: "Suspicious USB quarantined",
    failTitle: "Unsafe device handling",
    successDescription: "The unknown device was handled safely.",
    failDescription: "The risky device was not handled in the safest way.",
    successLog: "The suspicious USB was sent to IT safely.",
    failLog: "The suspicious USB was not quarantined correctly.",
  },
  {
    id: "mfa",
    name: "MFA Push",
    render: renderMfaTask,
    lesson: {
      correctAction: "Deny the request and report the push spam.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Unexpected MFA requests should never be approved. Denying and reporting them helps stop attackers using push fatigue.",
    },
    successTitle: "MFA push spam stopped",
    failTitle: "MFA incident mishandled",
    successDescription: "The unexpected sign-in request was denied and reported.",
    failDescription: "The MFA spam incident was not handled correctly.",
    successLog: "Unexpected MFA request denied and reported.",
    failLog: "The MFA push incident was handled poorly.",
  },
  {
    id: "wifi",
    name: "Wi-Fi And VPN",
    render: renderWifiTask,
    lesson: {
      correctAction: "Use a trusted connection like a hotspot and keep the company VPN on.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Public Wi-Fi can be risky. A safer connection plus a VPN adds protection when working outside the office.",
    },
    successTitle: "Remote connection secured",
    failTitle: "Remote connection left weak",
    successDescription: "The remote connection was handled safely.",
    failDescription: "The connection choice exposed company traffic to extra risk.",
    successLog: "A safer connection method was chosen for remote work.",
    failLog: "The remote connection choice was not secure enough.",
  },
  {
    id: "screen-lock",
    name: "Screen Lock",
    render: renderScreenLockTask,
    lesson: {
      correctAction: "Lock the computer before stepping away.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "An unlocked computer can expose company information or let someone act as you. Locking the screen is a simple everyday habit that reduces risk.",
    },
    successTitle: "Desk left safely",
    failTitle: "Desk left exposed",
    successDescription: "The workstation was protected before leaving the desk.",
    failDescription: "The workstation was left too open to misuse.",
    successLog: "The screen was locked before the user stepped away.",
    failLog: "The desk was left without proper screen protection.",
  },
  {
    id: "data-classification",
    name: "Data Classification",
    render: renderDataClassificationTask,
    lesson: {
      correctAction: "Sort public material as public, meeting notes as internal, and salary records as confidential.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Different information needs different protection. Sensitive employee or financial data should get stronger handling than ordinary work information.",
    },
    successTitle: "Documents sorted safely",
    failTitle: "Documents classified incorrectly",
    successDescription: "The office documents were placed in the correct protection levels.",
    failDescription: "At least one document was placed in the wrong handling category.",
    successLog: "The participant classified office documents correctly.",
    failLog: "The participant misclassified sensitive workplace information.",
  },
  {
    id: "safe-website",
    name: "Safe Website Check",
    render: renderSafeWebsiteTask,
    lesson: {
      correctAction: "Choose the official HTTPS company portal with the correct domain spelling.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Attackers often use fake or lookalike websites. Checking the exact web address and secure connection helps avoid credential theft.",
    },
    successTitle: "Safe portal identified",
    failTitle: "Unsafe website chosen",
    successDescription: "The safest sign-in page was identified correctly.",
    failDescription: "The chosen website showed warning signs and could expose credentials.",
    successLog: "The participant chose the safe company website.",
    failLog: "The participant selected a risky login website.",
  },
  {
    id: "backup-builder",
    name: "Backup Builder",
    render: renderBackupBuilderTask,
    lesson: {
      correctAction: "Choose more than one backup copy and keep backups running on a regular schedule.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "Backups help when files are lost, deleted, or hit by ransomware. A safer backup setup uses multiple copies and happens regularly.",
    },
    successTitle: "Backup plan improved",
    failTitle: "Backup plan too weak",
    successDescription: "The office backup plan now supports better recovery.",
    failDescription: "The chosen backup plan would not recover well from data loss.",
    successLog: "The participant built a stronger backup plan.",
    failLog: "The backup plan selected was not strong enough.",
  },
  {
    id: "incident-order",
    name: "Incident Response Order",
    render: renderIncidentOrderTask,
    lesson: {
      correctAction: "Report first, secure access next, share details, then follow the support team guidance.",
      reasonTitle: "Why this is the safest answer",
      reasonText: "When something goes wrong, fast reporting and account protection reduce damage. Good details then help the response team handle the incident properly.",
    },
    successTitle: "Incident handled in good order",
    failTitle: "Incident steps out of order",
    successDescription: "The response order made sense for a lost office device.",
    failDescription: "The response order missed the safest first steps.",
    successLog: "The participant chose a sensible incident response order.",
    failLog: "The incident response order was not correct.",
  },
];

const TASK_GUIDES = {
  phishing: {
    challengeType: "Sorting Challenge",
    scenario: "You are starting the workday and checking your office inbox. One message is trying to scare you into acting too quickly.",
    puzzleFix: "Check the sender, the wording, and whether the request is unexpected. Safe messages stay in the inbox. Suspicious messages should be reported, not clicked.",
    clues: [
      "Urgent pressure like 'do this now' is a warning sign.",
      "A sender address that looks almost right can still be fake.",
      "Unexpected password reset emails should be verified first."
    ],
  },
  password: {
    challengeType: "Build Challenge",
    scenario: "You need to create a password for a company account, and weak choices will put the account at risk.",
    puzzleFix: "Build a password that is longer, mixed, and harder to guess. Avoid common words, easy patterns, and simple number endings.",
    clues: [
      "Length matters.",
      "Mix upper and lower case letters, numbers, and symbols.",
      "Avoid words like 'company' or 'password'."
    ],
  },
  device: {
    challengeType: "Protection Setup",
    scenario: "A company computer shows a security warning and needs maintenance before it becomes an easy target.",
    puzzleFix: "Turn on the actions that add protection and avoid actions that hide or weaken security tools.",
    clues: [
      "Updates fix known problems.",
      "Scanning checks for threats already on the device.",
      "Firewalls should stay on in a normal office environment."
    ],
  },
  ids: {
    challengeType: "Spot-The-Signal",
    scenario: "A monitoring board is showing many office events. Your job is to find the ones that actually suggest suspicious behavior.",
    puzzleFix: "Focus on login failure patterns and unusual access attempts, not ordinary office system activity.",
    clues: [
      "Repeated failed logins deserve attention.",
      "An admin attempt after failed logins is more suspicious than printing or syncing.",
      "Normal system messages can be noisy but harmless."
    ],
  },
  ips: {
    challengeType: "Match-And-Block",
    scenario: "The attacker has been identified. Now you must choose the correct source and stop it.",
    puzzleFix: "Match the source from the previous alert trail, then choose an action that actually prevents the attack.",
    clues: [
      "The hostile source is the one linked to suspicious failed logins.",
      "Blocking is stronger than just watching.",
      "Sharing passwords is never an attack response."
    ],
  },
  fail2ban: {
    challengeType: "Layered Defense",
    scenario: "A service is getting repeated failed login attempts, which can be a brute-force attack.",
    puzzleFix: "Use more than one defense: automated IP blocking, account protection, and a sensible retry limit.",
    clues: [
      "Fail2Ban helps by blocking abusive sources automatically.",
      "Locking the account reduces immediate exposure.",
      "A threshold should be strict enough to stop abuse without being extreme."
    ],
  },
  usb: {
    challengeType: "Risk Sorting",
    scenario: "A removable device appears in the office with no trusted owner. It could be harmless, or it could be bait.",
    puzzleFix: "Treat unknown devices as suspicious and quarantine them instead of plugging them into company equipment.",
    clues: [
      "Unknown USB devices can contain malware.",
      "Approved company devices usually have labels or trusted packaging.",
      "Curiosity is exactly what this kind of attack relies on."
    ],
  },
  mfa: {
    challengeType: "Approve-Or-Deny",
    scenario: "Your phone is asking you to approve a sign-in that you did not request.",
    puzzleFix: "Deny unexpected prompts and report them. Never approve just to stop the notifications.",
    clues: [
      "Unexpected MFA prompts can be attacker push fatigue.",
      "Approving the request may let the attacker in.",
      "Reporting helps the security team investigate."
    ],
  },
  wifi: {
    challengeType: "Safe Remote Work",
    scenario: "You are working outside the office and need to choose how to connect safely.",
    puzzleFix: "Use a safer connection method and keep company protections like VPN turned on.",
    clues: [
      "Open public Wi-Fi is less trustworthy.",
      "A hotspot can be safer than free public Wi-Fi.",
      "VPN adds protection for company traffic."
    ],
  },
  "screen-lock": {
    challengeType: "Desk Habit",
    scenario: "You need to step away from your desk, but your computer is still open.",
    puzzleFix: "Protect the workstation before leaving so nobody else can use your account or view sensitive information.",
    clues: [
      "Unlocked screens expose company information.",
      "Passwords should never be shared with coworkers.",
      "Locking a screen is a simple daily habit with real security value."
    ],
  },
  "data-classification": {
    challengeType: "Sorting Challenge",
    scenario: "Your office uses different labels for different kinds of information, and each type should be handled carefully.",
    puzzleFix: "Sort documents by how sensitive they are. Public information can be shared widely. Internal information stays inside the company. Confidential information gets the strongest protection.",
    clues: [
      "Published company materials are usually public.",
      "Ordinary team notes are often internal only.",
      "Salary or personal employee data is confidential."
    ],
  },
  "safe-website": {
    challengeType: "Inspection Challenge",
    scenario: "You need to log in to a company portal, but attackers may use fake websites to steal passwords.",
    puzzleFix: "Choose the site with the exact company domain and a secure HTTPS connection. Avoid lookalike spellings and strange addresses.",
    clues: [
      "Look carefully at the exact domain name.",
      "HTTPS is safer than plain HTTP.",
      "Attackers often rely on small spelling tricks."
    ],
  },
  "backup-builder": {
    challengeType: "Build-A-Plan",
    scenario: "The office needs a simple data backup plan so work can be recovered after mistakes, device loss, or ransomware.",
    puzzleFix: "Pick backup actions that create more than one copy and happen regularly. A single copy on one device is not enough.",
    clues: [
      "More than one backup copy is safer.",
      "Regular backup schedules matter.",
      "Backups should not live only on the main working device."
    ],
  },
  "incident-order": {
    challengeType: "Order-The-Steps",
    scenario: "An office device has gone missing, and the worker must respond in the safest order.",
    puzzleFix: "Report the problem quickly, secure account access, give helpful details, and then follow the response team guidance.",
    clues: [
      "Reporting quickly reduces delay and confusion.",
      "Securing the account can reduce immediate damage.",
      "Clear details help the support team act faster."
    ],
  },
};

soundToggle.addEventListener("click", () => {
  appState.soundEnabled = !appState.soundEnabled;
  ensureAudioReady();
  updateSoundLabel();
  if (appState.soundEnabled) {
    playSound("click");
  }
});

function ensureAudioReady() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtor) {
    return null;
  }

  if (!appState.audioContext) {
    appState.audioContext = new AudioCtor();
  }

  if (appState.audioContext.state === "suspended") {
    appState.audioContext.resume();
  }

  return appState.audioContext;
}

function playSound(kind) {
  if (!appState.soundEnabled) {
    return;
  }

  const ctx = ensureAudioReady();

  if (!ctx) {
    return;
  }

  const now = ctx.currentTime;

  if (kind === "click") {
    playTone(ctx, 420, now, 0.05, "triangle", 0.03);
  } else if (kind === "success") {
    playTone(ctx, 520, now, 0.06, "triangle", 0.04);
    playTone(ctx, 720, now + 0.07, 0.1, "triangle", 0.04);
  } else if (kind === "fail") {
    playTone(ctx, 260, now, 0.08, "sawtooth", 0.04);
    playTone(ctx, 180, now + 0.09, 0.12, "sawtooth", 0.04);
  }
}

function playTone(ctx, frequency, startAt, duration, type, gainValue) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function updateSoundLabel() {
  document.getElementById("soundLabel").textContent = appState.soundEnabled ? "On" : "Off";
}

function renderStartScreen() {
  appState.started = false;
  setTopicTheme("home");
  sceneContainer.innerHTML = "";
  sceneContainer.appendChild(document.getElementById("startTemplate").content.cloneNode(true));

  const nameInput = document.getElementById("participantNameInput");
  nameInput.value = appState.participantName;

  bindAction(sceneContainer.querySelector('[data-action="start-game"]'), startGame);
  bindAction(sceneContainer.querySelector('[data-action="view-controls"]'), () => {
    playSound("click");
    sceneContainer.querySelector("#startHint").classList.toggle("hidden");
  });

  setLog([
    "Welcome. This version is designed for beginner participants.",
    "There are 14 short tasks with a clear explanation after each one.",
    "Enter a name so the certificate and score record can use it.",
  ]);

  updateHud();
}

function startGame() {
  ensureAudioReady();
  playSound("click");

  const nameInput = document.getElementById("participantNameInput");
  const enteredName = nameInput ? nameInput.value.trim() : "";
  appState.participantName = enteredName || appState.participantName || "Participant";
  appState.started = true;
  appState.currentTask = 0;
  appState.score = 0;
  appState.risk = 0;
  appState.correctCount = 0;
  appState.mistakes = 0;
  appState.totalRetries = 0;
  appState.taskAttemptCounts = {};
  appState.sessionStartedAt = new Date().toISOString();
  appState.sessionFinishedAt = null;
  appState.sessionDurationSeconds = 0;
  appState.serverStatus = "Not submitted yet";
  appState.submissionSaved = false;
  appState.taskResults = [];
  resetTaskState();
  loadCurrentTask();
}

function resetTaskState() {
  appState.phishing = { selectedId: null, zones: { safe: [], report: [] } };
  appState.password = { parts: [] };
  appState.device = { update: false, scan: false, firewall: false, muteWarnings: false };
  appState.ids = { selected: new Set() };
  appState.ips = { selectedIp: null, selectedAction: null };
  appState.fail2ban = { enabled: false, locked: false, threshold: null };
  appState.usb = { selectedItem: null, quarantinedId: null };
  appState.mfa = { deny: false, report: false, approve: false };
  appState.wifi = { choice: null, vpnEnabled: false };
  appState.screenLock = { choice: null };
  appState.dataSort = { selectedId: null, zones: { public: [], internal: [], confidential: [] } };
  appState.browsing = { selectedSite: null };
  appState.backup = { selected: new Set() };
  appState.incident = { sequence: [] };
}

function loadCurrentTask() {
  resetTaskState();
  setTopicTheme(TASKS[appState.currentTask].id);
  TASKS[appState.currentTask].render();
  updateHud();
}

function rerenderCurrentTask() {
  TASKS[appState.currentTask].render();
  updateHud();
}

function updateHud() {
  scoreValue.textContent = String(appState.score);
  riskValue.textContent = `${appState.risk}%`;
  taskValue.textContent = appState.started ? `${Math.min(appState.currentTask + 1, TASKS.length)}/${TASKS.length}` : `0/${TASKS.length}`;
  streakValue.textContent = String(appState.correctCount);
  mistakeValue.textContent = String(appState.mistakes);
  riskFill.style.width = `${appState.risk}%`;

  const currentRisk = riskStates.find((entry) => appState.risk <= entry.max) || riskStates[riskStates.length - 1];
  riskLabel.textContent = currentRisk.label;
  riskSummary.textContent = currentRisk.summary;
}

function setLog(items) {
  eventLog.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function completeTask(success, task) {
  const attempts = appState.taskAttemptCounts[task.id] || 1;
  const retriesUsed = Math.max(0, attempts - 1);
  appState.score += success ? 10 : -5;
  appState.risk = clamp(appState.risk + (success ? 4 : 12), 0, 100);

  if (success) {
    appState.correctCount += 1;
  } else {
    appState.mistakes += 1;
  }

  appState.taskResults.push({
    id: task.id,
    name: task.name,
    success,
    attempts,
    retriesUsed,
  });

  updateHud();
  setLog([
    success ? task.successLog : task.failLog,
    `Score is now ${appState.score}.`,
    task.lesson.reasonText,
  ]);

  playSound(success ? "success" : "fail");
  showTransitionCard(task, success);
}

function handleTaskSubmission(success) {
  const task = TASKS[appState.currentTask];
  const nextAttempts = (appState.taskAttemptCounts[task.id] || 0) + 1;
  appState.taskAttemptCounts[task.id] = nextAttempts;

  if (success) {
    completeTask(true, task);
    return;
  }

  const canRetry = nextAttempts < 3;
  showRetryCard(task, canRetry, nextAttempts);
}

function showRetryCard(task, canRetry, attempts) {
  const guide = TASK_GUIDES[task.id];

  sceneContainer.innerHTML = `
    <section class="task-stage">
      <div class="result-card pulse">
        <p class="eyebrow">Review And Learn</p>
        <h2>${task.failTitle}</h2>
        <p>${task.failDescription}</p>
        <div class="result-note">
          <strong>Right answer</strong>
          <p>${task.lesson.correctAction}</p>
          <strong>Why this matters</strong>
          <p>${task.lesson.reasonText}</p>
          <strong>How to fix it at work</strong>
          <p>${guide.puzzleFix}</p>
          <strong>Attempt summary</strong>
          <p>You have submitted this task ${attempts} time(s). ${canRetry ? "You can try again to improve your result." : "The retry limit for this task has been reached."}</p>
        </div>
        <div class="panel-actions">
          ${canRetry ? '<button class="primary-btn" data-action="retry-task">Try Again</button>' : ""}
          <button class="secondary-btn" data-action="continue-task">Continue</button>
        </div>
      </div>
    </section>
  `;

  if (canRetry) {
    bindAction(sceneContainer.querySelector('[data-action="retry-task"]'), () => {
      playSound("click");
      appState.totalRetries += 1;
      resetTaskState();
      loadCurrentTask();
    });
  }

  bindAction(sceneContainer.querySelector('[data-action="continue-task"]'), () => {
    playSound("click");
    completeTask(false, task);
  });
}

function showTransitionCard(task, success) {
  const guide = TASK_GUIDES[task.id];
  sceneContainer.innerHTML = `
    <section class="task-stage">
      <div class="result-card pulse">
        <p class="eyebrow">${success ? "Task Complete" : "Try To Remember This"}</p>
        <h2>${success ? task.successTitle : task.failTitle}</h2>
        <p>${success ? task.successDescription : task.failDescription}</p>
        <div class="result-note">
          <strong>Right answer:</strong>
          <p>${task.lesson.correctAction}</p>
          <strong>${task.lesson.reasonTitle}</strong>
          <p>${task.lesson.reasonText}</p>
          <strong>How to fix this at work</strong>
          <p>${guide.puzzleFix}</p>
        </div>
        <div class="panel-actions">
          <button class="primary-btn" data-action="next-task">${appState.currentTask === TASKS.length - 1 ? "See Results" : "Next Task"}</button>
        </div>
      </div>
    </section>
  `;

  bindAction(sceneContainer.querySelector('[data-action="next-task"]'), () => {
    playSound("click");
    goToNextTask();
  });
}

function renderCoachPanel(guide) {
  return `
    <section class="coach-panel">
      <article class="coach-card coach-feature">
        <p class="eyebrow">Challenge Type</p>
        <h3>${guide.challengeType}</h3>
        <p>${guide.scenario}</p>
      </article>
      <article class="coach-card">
        <p class="eyebrow">How To Solve</p>
        <p>${guide.puzzleFix}</p>
      </article>
      <article class="coach-card">
        <p class="eyebrow">What To Notice</p>
        <ul class="coach-list">
          ${guide.clues.map((clue) => `<li>${clue}</li>`).join("")}
        </ul>
      </article>
    </section>
  `;
}

function goToNextTask() {
  appState.currentTask += 1;

  if (appState.currentTask >= TASKS.length) {
    renderResults();
    return;
  }

  loadCurrentTask();
}

function renderResults() {
  updateHud();
  setTopicTheme("results");
  appState.sessionFinishedAt = new Date().toISOString();
  appState.sessionDurationSeconds = appState.sessionStartedAt
    ? Math.max(1, Math.round((new Date(appState.sessionFinishedAt) - new Date(appState.sessionStartedAt)) / 1000))
    : 0;
  const rating = appState.risk <= 25 ? "Office Guardian" : appState.risk <= 55 ? "Security Learner" : "Needs More Practice";
  const ending = appState.risk >= 70
    ? "The participant completed the game, but the company would still need extra support."
    : "The participant completed the game with a good level of workplace security awareness.";

  sceneContainer.innerHTML = `
    <section class="task-stage">
      <div class="task-header">
        <div>
          <p class="eyebrow">Completion Screen</p>
          <h2>${rating}</h2>
          <p>${ending}</p>
        </div>
        <span class="tag">Results</span>
      </div>

      <div class="result-grid">
        <article class="result-stat">
          <span class="eyebrow">Participant</span>
          <strong>${escapeHtml(appState.participantName)}</strong>
        </article>
        <article class="result-stat">
          <span class="eyebrow">Score</span>
          <strong>${appState.score}</strong>
        </article>
        <article class="result-stat">
          <span class="eyebrow">Tasks Correct</span>
          <strong>${appState.correctCount}/${TASKS.length}</strong>
        </article>
        <article class="result-stat">
          <span class="eyebrow">Retries</span>
          <strong>${appState.totalRetries}</strong>
        </article>
      </div>

      <div class="task-grid two">
        <div class="result-card">
          <h3>Research Record</h3>
          <p id="serverStatusText">Data collection status: ${escapeHtml(appState.serverStatus)}</p>
          <p class="tiny-copy">Time taken: ${formatDuration(appState.sessionDurationSeconds)}. Wrong tasks: ${appState.mistakes}. If the local or online server is running, the participant result will be stored for supervision and later review.</p>
          <div class="panel-actions">
            <button class="primary-btn" data-action="save-result">Save Result Now</button>
            <a class="secondary-btn" href="supervisor-dashboard.html">Open Supervisor Dashboard</a>
          </div>
        </div>

        <div class="result-card">
          <h3>Certificate</h3>
          <div class="certificate-preview">
            <div class="certificate-ribbon">CyberSafe Office</div>
            <div class="certificate-inner">
              <p class="certificate-label">Certificate of Completion</p>
              <p class="tiny-copy">Presented to</p>
              <h4>${escapeHtml(appState.participantName)}</h4>
              <p>has successfully completed the Workplace Security Challenge for office staff beginners.</p>
              <div class="certificate-meta">
                <span>Score: ${appState.score}</span>
                <span>Tasks Correct: ${appState.correctCount}/${TASKS.length}</span>
                <span>Time: ${formatDuration(appState.sessionDurationSeconds)}</span>
              </div>
              <div class="certificate-seal">Verified Training Award</div>
            </div>
          </div>
          <div class="panel-actions">
            <button class="primary-btn" data-action="download-certificate">Download PDF Certificate</button>
            <button class="secondary-btn" data-action="restart-game">Play Again</button>
          </div>
        </div>
      </div>
    </section>
  `;

  bindAction(sceneContainer.querySelector('[data-action="save-result"]'), saveSubmission);
  bindAction(sceneContainer.querySelector('[data-action="download-certificate"]'), downloadCertificatePdf);
  bindAction(sceneContainer.querySelector('[data-action="restart-game"]'), startGame);

  saveSubmission();

  setLog([
    `${appState.participantName} completed the game.`,
    `Final score: ${appState.score}. Tasks correct: ${appState.correctCount}/${TASKS.length}. Time taken: ${formatDuration(appState.sessionDurationSeconds)}.`,
    `Data collection status: ${appState.serverStatus}.`,
  ]);
}

async function saveSubmission() {
  if (appState.submissionSaved) {
    updateServerStatus(`Saved successfully`);
    return;
  }

  const payload = {
    participantName: appState.participantName,
    score: appState.score,
    risk: appState.risk,
    correctCount: appState.correctCount,
    wrongCount: appState.mistakes,
    retries: appState.totalRetries,
    totalTasks: TASKS.length,
    rating: appState.risk <= 25 ? "Office Guardian" : appState.risk <= 55 ? "Security Learner" : "Needs More Practice",
    startedAt: appState.sessionStartedAt,
    finishedAt: appState.sessionFinishedAt || new Date().toISOString(),
    durationSeconds: appState.sessionDurationSeconds,
    taskResults: appState.taskResults,
  };

  try {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Save failed");
    }

    const result = await response.json();
    appState.submissionSaved = true;
    updateServerStatus(`Saved successfully with ID ${result.id}`);
  } catch (error) {
    updateServerStatus("Server not available. Result can still be played locally.");
  }
}

function updateServerStatus(text) {
  appState.serverStatus = text;
  const statusNode = document.getElementById("serverStatusText");
  if (statusNode) {
    statusNode.textContent = `Data collection status: ${text}`;
  }
}

function downloadCertificatePdf() {
  playSound("click");
  const dateText = new Date().toLocaleDateString();
  const timeText = new Date().toLocaleTimeString();
  const certificateId = `CSO-${Date.now()}`;
  const rating = appState.risk <= 25 ? "Office Guardian" : appState.risk <= 55 ? "Security Learner" : "Needs More Practice";
  const lines = [
    "CyberSafe Office Certificate",
    "Certificate of Completion",
    sanitizePdfText(appState.participantName),
    "completed the CyberSafe Office Workplace Security Challenge.",
    `Score: ${appState.score}`,
    `Tasks Completed Correctly: ${appState.correctCount} of ${TASKS.length}`,
    `Wrong Tasks: ${appState.mistakes}`,
    `Retries Used: ${appState.totalRetries}`,
    `Final Risk Level: ${appState.risk}%`,
    `Award Rating: ${rating}`,
    `Time Taken: ${formatDuration(appState.sessionDurationSeconds)}`,
    `Completion Date: ${dateText}`,
    `Completion Time: ${timeText}`,
    `Certificate ID: ${certificateId}`,
    "Training Audience: Office workers with no cybersecurity background",
  ];

  const pdfBytes = buildSimplePdf(lines);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appState.participantName.replace(/[^a-z0-9]+/gi, "_") || "participant"}_certificate.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildSimplePdf(lines) {
  const contentLines = [
    "0.08 0.12 0.24 rg",
    "0 0 595 842 re",
    "f",
    "0.54 0.88 0.96 RG",
    "4 w",
    "34 34 527 774 re",
    "S",
    "0.49 0.95 0.77 rg",
    "34 748 527 60 re",
    "f",
    "0.08 0.12 0.24 rg",
    "BT",
    "/F1 30 Tf",
    "74 772 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "ET",
    "0.98 0.84 0.43 rg",
    "470 125 50 50 re",
    "f",
    "0.08 0.12 0.24 rg",
    "BT",
    "/F1 12 Tf",
    "454 98 Td",
    "(Verified Award) Tj",
    "ET",
  ];

  const positions = [700, 650, 600, 548, 510, 472, 434];

  for (let i = 1; i < lines.length; i += 1) {
    const y = positions[i - 1] || (392 - (i * 30));
    contentLines.push("BT");
    if (i === 1) {
      contentLines.push("/F1 14 Tf");
    } else if (i === 2) {
      contentLines.push("/F1 28 Tf");
    } else {
      contentLines.push("/F1 16 Tf");
    }
    contentLines.push(`70 ${y} Td`);
    contentLines.push(`(${escapePdfText(lines[i])}) Tj`);
    contentLines.push("ET");
  }

  const contentStream = contentLines.join("\n");
  const objects = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");
  objects.push("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj");
  objects.push("3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj");
  objects.push("4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj");
  objects.push(`5 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

function renderPhishingTask() {
  const unplaced = phishingEmails.filter((mail) => !isEmailPlaced(mail.id));

  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 1 - Phishing</p>
          <h2>Sort the inbox items into the correct place.</h2>
          <p>Drag emails into Safe Inbox or Security Report. You can also click an email and use the move buttons.</p>
        </div>
        <span class="tag">Beginner Friendly</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.phishing)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Inbox Queue</h3>
          <div class="mail-list">
            ${unplaced.length ? unplaced.map((mail) => renderMailCard(mail)).join("") : '<p class="tiny-copy">Inbox queue is empty. Check the two lanes on the right.</p>'}
          </div>
          <div class="sticky-actions">
            <button class="secondary-btn" data-action="move-safe">Move Selected To Safe Inbox</button>
            <button class="secondary-btn" data-action="move-report">Move Selected To Security Report</button>
            <button class="mini-btn" data-action="move-back">Return Selected</button>
          </div>
        </div>

        <div class="panel-card">
          <h3>Sort Lanes</h3>
          <div class="drop-zones">
            ${renderDropZone("safe", "Safe Inbox", "Normal work email stays here.", appState.phishing.zones.safe)}
            ${renderDropZone("report", "Security Report", "Suspicious email should be reported here.", appState.phishing.zones.report)}
          </div>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="validate-phishing">Submit Answer</button>
          </div>
          <p class="helper-text" id="phishingHint">Tip: urgent language and strange sender domains are warning signs.</p>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll("[data-email-id]").forEach((element) => {
    element.addEventListener("click", () => {
      playSound("click");
      appState.phishing.selectedId = element.dataset.emailId;
      sceneContainer.querySelectorAll("[data-email-id]").forEach((node) => node.classList.remove("selected"));
      element.classList.add("selected");
    });
  });

  sceneContainer.querySelectorAll(".mail-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      appState.phishing.selectedId = card.dataset.emailId;
      card.classList.add("dragging");
      event.dataTransfer.setData("text/plain", card.dataset.emailId);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });
  });

  sceneContainer.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("active-drop");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("active-drop");
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("active-drop");
      const emailId = event.dataTransfer.getData("text/plain");
      placeEmail(emailId, zone.dataset.zone);
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="move-safe"]'), () => moveSelectedEmail("safe"));
  bindAction(sceneContainer.querySelector('[data-action="move-report"]'), () => moveSelectedEmail("report"));
  bindAction(sceneContainer.querySelector('[data-action="move-back"]'), () => moveSelectedEmail("inbox"));

  bindAction(sceneContainer.querySelector('[data-action="validate-phishing"]'), () => {
    playSound("click");
    const totalPlaced = appState.phishing.zones.safe.length + appState.phishing.zones.report.length;

    if (totalPlaced !== phishingEmails.length) {
      document.getElementById("phishingHint").textContent = "Please sort all three emails first.";
      return;
    }

    const success =
      appState.phishing.zones.report.length === 1 &&
      appState.phishing.zones.report.includes("phishing") &&
      appState.phishing.zones.safe.includes("safe-payroll") &&
      appState.phishing.zones.safe.includes("safe-facilities");

    handleTaskSubmission(success);
  });

  setLog([
    "Task 1: identify the suspicious email and report it.",
    "Safe messages stay in the inbox. Suspicious ones go to the report lane.",
    "You will get the correct explanation after you submit.",
  ]);
}

function renderPasswordTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 2 - Password</p>
          <h2>Build a strong password using the fragments below.</h2>
          <p>Choose up to four parts. Try to make the password long and mixed.</p>
        </div>
        <span class="tag">Easy To Understand</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.password)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Password Parts</h3>
          <div class="fragment-grid">
            ${["company", "123", "Wk", "@9!", "Lp", "2026", "Desk", "$", "Password", "77"].map(renderFragmentButton).join("")}
          </div>
          <div class="sticky-actions">
            <button class="secondary-btn" data-action="clear-password">Clear</button>
            <button class="primary-btn" data-action="submit-password">Submit Answer</button>
          </div>
        </div>

        <div class="panel-card">
          <h3>Password Strength Meter</h3>
          <div class="password-preview">
            <div class="password-output" id="passwordOutput">_ _ _ _</div>
            <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
            <p class="crack-time" id="crackTime">Estimated crack time: 2 seconds</p>
          </div>
          <p class="helper-text" id="passwordHint">Avoid obvious words like company or password.</p>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".fragment").forEach((fragment) => {
    fragment.addEventListener("click", () => {
      playSound("click");
      if (appState.password.parts.length >= 4) {
        document.getElementById("passwordHint").textContent = "Use up to four parts. Clear it if you want to try again.";
        return;
      }
      appState.password.parts.push(fragment.dataset.fragment);
      fragment.classList.add("selected");
      fragment.disabled = true;
      updatePasswordMeter();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="clear-password"]'), () => {
    playSound("click");
    appState.password.parts = [];
    rerenderCurrentTask();
  });

  bindAction(sceneContainer.querySelector('[data-action="submit-password"]'), () => {
    playSound("click");
    const password = appState.password.parts.join("");
    if (!password) {
      document.getElementById("passwordHint").textContent = "Build a password first.";
      return;
    }
    handleTaskSubmission(evaluatePassword(password).strong);
  });

  updatePasswordMeter();
}

function renderDeviceTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 3 - Device Security</p>
          <h2>Choose the safe protection steps for this computer.</h2>
          <p>Turn on the actions that make the device safer, and avoid the one that weakens security.</p>
        </div>
        <span class="tag">Endpoint Safety</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.device)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Protection Controls</h3>
          <div class="toggle-list">
            ${renderToggleTile("update", "Install security update", "Fix known software problems.", appState.device.update)}
            ${renderToggleTile("scan", "Run antivirus scan", "Check for malware or suspicious files.", appState.device.scan)}
            ${renderToggleTile("firewall", "Keep firewall enabled", "Leave network protection on.", appState.device.firewall)}
            ${renderToggleTile("muteWarnings", "Disable security popups", "Hides warnings but weakens response visibility.", appState.device.muteWarnings)}
          </div>
        </div>

        <div class="panel-card">
          <h3>Submit</h3>
          <ul class="indicator-list">
            <li>Updates are good</li>
            <li>Scanning is good</li>
            <li>Firewall should stay on</li>
          </ul>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-device">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll('.toggle-tile[data-group="device"]').forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      const key = tile.dataset.toggle;
      appState.device[key] = !appState.device[key];
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-device"]'), () => {
    playSound("click");
    const success = appState.device.update && appState.device.scan && appState.device.firewall && !appState.device.muteWarnings;
    handleTaskSubmission(success);
  });
}

function renderIdsTask() {
  const suspiciousIds = ["ids-a", "ids-b"];
  const events = [
    { id: "ids-normal-a", time: "09:14", event: "Payroll portal login success", state: "Normal", alert: false },
    { id: "ids-a", time: "09:15", event: "6 failed VPN logins from 185.22.18.4", state: "Suspicious", alert: true },
    { id: "ids-normal-b", time: "09:15", event: "Printer queue restarted", state: "Normal", alert: false },
    { id: "ids-b", time: "09:16", event: "Admin login attempt after repeated failures", state: "Suspicious", alert: true },
  ];

  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 4 - IDS Detection</p>
          <h2>Select the alerts that really look suspicious.</h2>
          <p>Choose the warning signs and ignore the normal office events.</p>
        </div>
        <span class="tag">IDS</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.ids)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Alert Stream</h3>
          <div class="action-list">
            ${events.map((item) => renderLogLine(item, appState.ids.selected.has(item.id))).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Submit</h3>
          <p class="tiny-copy">Choose the suspicious login-related alerts only.</p>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-ids">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".log-line").forEach((line) => {
    line.addEventListener("click", () => {
      playSound("click");
      toggleSetSelection(appState.ids.selected, line.dataset.id);
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-ids"]'), () => {
    playSound("click");
    const success = appState.ids.selected.size === 2 && suspiciousIds.every((id) => appState.ids.selected.has(id));
    handleTaskSubmission(success);
  });
}

function renderIpsTask() {
  const actions = [
    { id: "block", title: "Block source IP", body: "Stop the attacker at the edge." },
    { id: "ignore", title: "Monitor only", body: "Watch the threat but do not stop it." },
    { id: "share", title: "Share password", body: "Unsafe and never correct." },
  ];

  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 5 - IPS Prevention</p>
          <h2>Choose the hostile IP and the right prevention action.</h2>
          <p>First select the source tied to the attack. Then choose how to stop it.</p>
        </div>
        <span class="tag">IPS</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.ips)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>IP List</h3>
          <div class="ip-list">
            ${[
              { id: "trusted-vpn", label: "10.0.4.8", note: "Trusted internal VPN relay" },
              { id: "hostile-ip", label: "185.22.18.4", note: "Matches the suspicious failed logins" },
              { id: "partner-api", label: "44.118.2.9", note: "Known partner service" },
            ].map((item) => renderIpRow(item, appState.ips.selectedIp === item.id)).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Action</h3>
          <div class="action-list">
            ${actions.map((action) => renderActionTile(action, appState.ips.selectedAction === action.id)).join("")}
          </div>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-ips">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".ip-row").forEach((row) => {
    row.addEventListener("click", () => {
      playSound("click");
      appState.ips.selectedIp = row.dataset.id;
      rerenderCurrentTask();
    });
  });

  sceneContainer.querySelectorAll(".action-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      appState.ips.selectedAction = tile.dataset.id;
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-ips"]'), () => {
    playSound("click");
    const success = appState.ips.selectedIp === "hostile-ip" && appState.ips.selectedAction === "block";
    handleTaskSubmission(success);
  });
}

function renderFail2banTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 6 - Fail2Ban</p>
          <h2>Stop repeated failed login attempts with the safest setup.</h2>
          <p>Turn on the right protections and choose the sensible retry threshold.</p>
        </div>
        <span class="tag">Login Protection</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.fail2ban)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Protection Controls</h3>
          <div class="toggle-list">
            ${renderToggleTile("enabled", "Enable Fail2Ban", "Automatically block abusive IP addresses.", appState.fail2ban.enabled, "fail2ban")}
            ${renderToggleTile("locked", "Lock targeted account", "Protect the account while the attack is active.", appState.fail2ban.locked, "fail2ban")}
          </div>
          <p class="tiny-copy">Choose a retry threshold:</p>
          <div class="panel-actions">
            ${[3, 5, 12].map((value) => `
              <button class="${appState.fail2ban.threshold === value ? "primary-btn" : "secondary-btn"}" data-threshold="${value}">
                ${value} retries
              </button>
            `).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Submit</h3>
          <p class="tiny-copy">Best choice: automatic blocking plus account protection, with a reasonable retry threshold.</p>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-fail2ban">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll('.toggle-tile[data-group="fail2ban"]').forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      const key = tile.dataset.toggle;
      appState.fail2ban[key] = !appState.fail2ban[key];
      rerenderCurrentTask();
    });
  });

  sceneContainer.querySelectorAll("[data-threshold]").forEach((button) => {
    button.addEventListener("click", () => {
      playSound("click");
      appState.fail2ban.threshold = Number(button.dataset.threshold);
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-fail2ban"]'), () => {
    playSound("click");
    const success = appState.fail2ban.enabled && appState.fail2ban.locked && appState.fail2ban.threshold === 5;
    handleTaskSubmission(success);
  });
}

function renderUsbTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 7 - USB Safety</p>
          <h2>Choose the suspicious device and quarantine it.</h2>
          <p>Unknown removable devices should not be trusted in the workplace.</p>
        </div>
        <span class="tag">USB</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.usb)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Desk Items</h3>
          <div class="action-list">
            ${usbItems.map((item) => `
              <button class="action-tile ${appState.usb.selectedItem === item.id ? "selected" : ""}" data-item-id="${item.id}">
                <strong>${item.title}</strong>
                <p class="tiny-copy">${item.body}</p>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Response</h3>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="quarantine-usb">Quarantine Selected Item</button>
            <button class="secondary-btn" data-action="submit-usb">Submit Answer</button>
          </div>
          <p class="helper-text" id="usbHint">${appState.usb.quarantinedId ? "Item sent to IT/security." : "Select the risky item first."}</p>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", () => {
      playSound("click");
      appState.usb.selectedItem = button.dataset.itemId;
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="quarantine-usb"]'), () => {
    playSound("click");
    if (!appState.usb.selectedItem) {
      document.getElementById("usbHint").textContent = "Select an item before quarantining it.";
      return;
    }
    appState.usb.quarantinedId = appState.usb.selectedItem;
    rerenderCurrentTask();
  });

  bindAction(sceneContainer.querySelector('[data-action="submit-usb"]'), () => {
    playSound("click");
    const success = appState.usb.selectedItem === "mystery-usb" && appState.usb.quarantinedId === "mystery-usb";
    handleTaskSubmission(success);
  });
}

function renderMfaTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 8 - MFA Push</p>
          <h2>You receive a sign-in approval request that you did not trigger.</h2>
          <p>Choose the safe response for an unexpected MFA prompt.</p>
        </div>
        <span class="tag">MFA</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.mfa)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Phone Prompt</h3>
          <div class="toggle-list">
            ${renderToggleTile("deny", "Deny request", "Reject the sign-in request.", appState.mfa.deny, "mfa")}
            ${renderToggleTile("report", "Report push spam", "Tell the security team this was unexpected.", appState.mfa.report, "mfa")}
            ${renderToggleTile("approve", "Approve request", "This would let the attacker in.", appState.mfa.approve, "mfa")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Submit</h3>
          <p class="tiny-copy">Best choice: deny the request and report it.</p>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-mfa">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll('.toggle-tile[data-group="mfa"]').forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      const key = tile.dataset.toggle;
      appState.mfa[key] = !appState.mfa[key];
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-mfa"]'), () => {
    playSound("click");
    const success = appState.mfa.deny && appState.mfa.report && !appState.mfa.approve;
    handleTaskSubmission(success);
  });
}

function renderWifiTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 9 - Wi-Fi And VPN</p>
          <h2>You are working outside the office. Which connection is safest?</h2>
          <p>Pick the best option for beginner-safe remote work.</p>
        </div>
        <span class="tag">Remote Work</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES.wifi)}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Connection Choices</h3>
          <div class="action-list">
            ${[
              { id: "cafe-open", title: "Use free cafe Wi-Fi", body: "Easy, but less secure." },
              { id: "hotspot", title: "Use mobile hotspot", body: "Safer than open public Wi-Fi." },
              { id: "public-wifi", title: "Use public Wi-Fi", body: "Common, but riskier than trusted connections." },
            ].map((action) => renderActionTile(action, appState.wifi.choice === action.id)).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Protection Choice</h3>
          <div class="toggle-list">
            ${renderToggleTile("vpnEnabled", "Keep company VPN on", "VPN adds protection for remote work traffic.", appState.wifi.vpnEnabled, "wifi")}
          </div>
          <p class="tiny-copy">Best result: choose the safer connection and keep VPN turned on.</p>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-wifi">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".action-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      appState.wifi.choice = tile.dataset.id;
      rerenderCurrentTask();
    });
  });

  sceneContainer.querySelectorAll('.toggle-tile[data-group="wifi"]').forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      appState.wifi.vpnEnabled = !appState.wifi.vpnEnabled;
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-wifi"]'), () => {
    playSound("click");
    handleTaskSubmission(appState.wifi.choice === "hotspot" && appState.wifi.vpnEnabled);
  });
}

function renderScreenLockTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 10 - Screen Lock</p>
          <h2>You need to leave your desk for a few minutes.</h2>
          <p>Choose the safest action for protecting your workstation.</p>
        </div>
        <span class="tag">Physical Security</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES["screen-lock"])}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Choices</h3>
          <div class="action-list">
            ${[
              { id: "leave-open", title: "Leave the screen unlocked", body: "Quick, but unsafe." },
              { id: "lock-screen", title: "Lock the screen before leaving", body: "Simple and safe." },
              { id: "share-password", title: "Give your password to a coworker to watch it", body: "Unsafe and unnecessary." },
            ].map((action) => renderActionTile(action, appState.screenLock.choice === action.id)).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Submit</h3>
          <p class="tiny-copy">Choose the action that protects the computer and the account.</p>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="confirm-screen-lock">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".action-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      appState.screenLock.choice = tile.dataset.id;
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="confirm-screen-lock"]'), () => {
    playSound("click");
    handleTaskSubmission(appState.screenLock.choice === "lock-screen");
  });
}

function renderDataClassificationTask() {
  const unplaced = documentItems.filter((item) => !isDocumentPlaced(item.id));

  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 11 - Data Classification</p>
          <h2>Sort the office documents by how sensitive they are.</h2>
          <p>Drag each item into Public, Internal, or Confidential. You can also click and use the move buttons.</p>
        </div>
        <span class="tag">Information Handling</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES["data-classification"])}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Documents To Sort</h3>
          <div class="mail-list">
            ${unplaced.length ? unplaced.map((item) => renderDocumentCard(item)).join("") : '<p class="tiny-copy">All items have been placed. Review the categories on the right.</p>'}
          </div>
          <div class="sticky-actions">
            <button class="secondary-btn" data-action="move-public">Move Selected To Public</button>
            <button class="secondary-btn" data-action="move-internal">Move Selected To Internal</button>
            <button class="secondary-btn" data-action="move-confidential">Move Selected To Confidential</button>
          </div>
        </div>

        <div class="panel-card">
          <h3>Classification Lanes</h3>
          <div class="drop-zones">
            ${renderDocumentDropZone("public", "Public", "Safe for approved public sharing.", appState.dataSort.zones.public)}
            ${renderDocumentDropZone("internal", "Internal", "For staff use inside the company.", appState.dataSort.zones.internal)}
            ${renderDocumentDropZone("confidential", "Confidential", "Needs stronger protection and restricted access.", appState.dataSort.zones.confidential)}
          </div>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="submit-data-sort">Submit Answer</button>
          </div>
          <p class="helper-text" id="dataHint">Tip: salary and personal staff data should have the strongest protection.</p>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll("[data-doc-id]").forEach((element) => {
    element.addEventListener("click", () => {
      playSound("click");
      appState.dataSort.selectedId = element.dataset.docId;
      sceneContainer.querySelectorAll("[data-doc-id]").forEach((node) => node.classList.remove("selected"));
      element.classList.add("selected");
    });
  });

  sceneContainer.querySelectorAll(".document-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      appState.dataSort.selectedId = card.dataset.docId;
      card.classList.add("dragging");
      event.dataTransfer.setData("text/plain", card.dataset.docId);
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });

  sceneContainer.querySelectorAll(".drop-zone").forEach((zone) => {
    if (!zone.dataset.docZone) {
      return;
    }
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("active-drop");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("active-drop"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("active-drop");
      moveDocument(event.dataTransfer.getData("text/plain"), zone.dataset.docZone);
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="move-public"]'), () => moveSelectedDocument("public"));
  bindAction(sceneContainer.querySelector('[data-action="move-internal"]'), () => moveSelectedDocument("internal"));
  bindAction(sceneContainer.querySelector('[data-action="move-confidential"]'), () => moveSelectedDocument("confidential"));
  bindAction(sceneContainer.querySelector('[data-action="submit-data-sort"]'), () => {
    playSound("click");
    const totalPlaced = appState.dataSort.zones.public.length + appState.dataSort.zones.internal.length + appState.dataSort.zones.confidential.length;
    if (totalPlaced !== documentItems.length) {
      document.getElementById("dataHint").textContent = "Please sort all three documents before submitting.";
      return;
    }
    const success =
      appState.dataSort.zones.public.includes("doc-public") &&
      appState.dataSort.zones.internal.includes("doc-internal") &&
      appState.dataSort.zones.confidential.includes("doc-confidential");
    handleTaskSubmission(success);
  });
}

function renderSafeWebsiteTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 12 - Safe Website Check</p>
          <h2>Inspect the login websites and choose the safest one.</h2>
          <p>Select a site card to inspect its details, then submit the one you trust most.</p>
        </div>
        <span class="tag">Secure Browsing</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES["safe-website"])}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Website Options</h3>
          <div class="action-list">
            ${websiteOptions.map((site) => renderActionTile({ id: site.id, title: site.title, body: site.body }, appState.browsing.selectedSite === site.id)).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Inspection Notes</h3>
          <div class="result-note">
            <strong>Selected website</strong>
            <p>${appState.browsing.selectedSite ? escapeHtml(websiteOptions.find((site) => site.id === appState.browsing.selectedSite).title) : "Choose a site card to inspect it."}</p>
            <strong>What to notice</strong>
            <p>${appState.browsing.selectedSite ? escapeHtml(websiteOptions.find((site) => site.id === appState.browsing.selectedSite).clue) : "The clue panel will explain why a site looks safe or suspicious."}</p>
          </div>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="submit-website">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".action-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      appState.browsing.selectedSite = tile.dataset.id;
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="submit-website"]'), () => {
    playSound("click");
    handleTaskSubmission(appState.browsing.selectedSite === "safe-portal");
  });
}

function renderBackupBuilderTask() {
  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 13 - Backup Builder</p>
          <h2>Build the safest office backup plan.</h2>
          <p>Select the actions that make backup and recovery stronger. Leave out the weak choices.</p>
        </div>
        <span class="tag">Backup And Recovery</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES["backup-builder"])}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Backup Choices</h3>
          <div class="action-list">
            ${backupOptions.map((option) => renderActionTile({ id: option.id, title: option.title, body: option.body }, appState.backup.selected.has(option.id))).join("")}
          </div>
        </div>

        <div class="panel-card">
          <h3>Your Plan</h3>
          <div class="result-note">
            <strong>Selected actions</strong>
            <p>${appState.backup.selected.size ? escapeHtml([...appState.backup.selected].map((id) => backupOptions.find((option) => option.id === id).title).join(", ")) : "Pick the backup actions you want to include."}</p>
          </div>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="submit-backup">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".action-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      toggleSetSelection(appState.backup.selected, tile.dataset.id);
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="submit-backup"]'), () => {
    playSound("click");
    const good = ["copy-cloud", "copy-external", "regular-schedule"];
    const success = appState.backup.selected.size === 3 && good.every((id) => appState.backup.selected.has(id));
    handleTaskSubmission(success);
  });
}

function renderIncidentOrderTask() {
  const selectedTitles = appState.incident.sequence.map((id, index) => {
    const step = incidentSteps.find((item) => item.id === id);
    return `<div class="placed-email"><strong>Step ${index + 1}:</strong> ${escapeHtml(step.title)}</div>`;
  }).join("");

  sceneContainer.innerHTML = `
    <section class="task-stage pulse">
      <div class="task-header">
        <div>
          <p class="eyebrow">Task 14 - Incident Response Order</p>
          <h2>Put the response steps in the safest order.</h2>
          <p>Imagine a company phone or laptop has been lost. Click the step cards in the order you would do them.</p>
        </div>
        <span class="tag">Incident Reporting</span>
      </div>
      ${renderCoachPanel(TASK_GUIDES["incident-order"])}

      <div class="task-grid two">
        <div class="panel-card">
          <h3>Step Cards</h3>
          <div class="action-list">
            ${incidentSteps.map((step) => renderActionTile({ id: step.id, title: step.title, body: step.body }, appState.incident.sequence.includes(step.id))).join("")}
          </div>
          <div class="sticky-actions">
            <button class="secondary-btn" data-action="clear-incident-order">Clear Order</button>
          </div>
        </div>

        <div class="panel-card">
          <h3>Your Response Timeline</h3>
          <div class="mail-list">
            ${selectedTitles || '<div class="placed-email">No steps chosen yet.</div>'}
          </div>
          <div class="sticky-actions">
            <button class="primary-btn" data-action="submit-incident-order">Submit Answer</button>
          </div>
        </div>
      </div>
    </section>
  `;

  sceneContainer.querySelectorAll(".action-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      playSound("click");
      const id = tile.dataset.id;
      if (appState.incident.sequence.includes(id)) {
        return;
      }
      appState.incident.sequence.push(id);
      rerenderCurrentTask();
    });
  });

  bindAction(sceneContainer.querySelector('[data-action="clear-incident-order"]'), () => {
    playSound("click");
    appState.incident.sequence = [];
    rerenderCurrentTask();
  });

  bindAction(sceneContainer.querySelector('[data-action="submit-incident-order"]'), () => {
    playSound("click");
    const target = ["report-it", "secure-account", "share-details", "follow-help"];
    const success = appState.incident.sequence.length === target.length && target.every((id, index) => appState.incident.sequence[index] === id);
    handleTaskSubmission(success);
  });
}

function updatePasswordMeter() {
  const password = appState.password.parts.join("");
  const output = document.getElementById("passwordOutput");
  const fill = document.getElementById("strengthFill");
  const crackTime = document.getElementById("crackTime");

  if (!output || !fill || !crackTime) {
    return;
  }

  output.textContent = password || "_ _ _ _";
  const evaluation = evaluatePassword(password);
  fill.style.width = `${evaluation.score * 20}%`;
  crackTime.textContent = `Estimated crack time: ${evaluation.crackTime}`;
}

function evaluatePassword(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const longEnough = password.length >= 10;
  const obvious = /(company|password)/i.test(password);
  const score = [longEnough, hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;

  let crackTime = "2 seconds";

  if (score <= 2) {
    crackTime = "2 seconds";
  } else if (score === 3) {
    crackTime = "9 hours";
  } else if (score === 4) {
    crackTime = "14 years";
  } else {
    crackTime = "200+ years";
  }

  return {
    score,
    crackTime,
    strong: longEnough && hasUpper && hasLower && hasDigit && hasSymbol && !obvious,
  };
}

function renderMailCard(mail) {
  return `
    <article class="mail-card ${appState.phishing.selectedId === mail.id ? "selected" : ""}" data-email-id="${mail.id}" draggable="true">
      <div class="mail-meta">
        <span>${mail.from}</span>
        <span>Unread</span>
      </div>
      <h3>${mail.subject}</h3>
      <p class="mail-body">${mail.body}</p>
    </article>
  `;
}

function renderDocumentCard(item) {
  return `
    <article class="mail-card document-card ${appState.dataSort.selectedId === item.id ? "selected" : ""}" data-doc-id="${item.id}" draggable="true">
      <div class="mail-meta">
        <span>Office Document</span>
        <span>Sort Me</span>
      </div>
      <h3>${item.title}</h3>
      <p class="mail-body">${item.body}</p>
    </article>
  `;
}

function renderDropZone(zone, title, body, ids) {
  return `
    <div class="drop-zone" data-zone="${zone}">
      <strong>${title}</strong>
      <small>${body}</small>
      ${ids.length
        ? ids.map((id) => `<div class="placed-email ${appState.phishing.selectedId === id ? "selected" : ""}" data-email-id="${id}">${getEmailById(id).subject}</div>`).join("")
        : '<div class="placed-email">Drop items here</div>'}
    </div>
  `;
}

function renderDocumentDropZone(zone, title, body, ids) {
  return `
    <div class="drop-zone" data-doc-zone="${zone}">
      <strong>${title}</strong>
      <small>${body}</small>
      ${ids.length
        ? ids.map((id) => `<div class="placed-email ${appState.dataSort.selectedId === id ? "selected" : ""}" data-doc-id="${id}">${escapeHtml(documentItems.find((item) => item.id === id).title)}</div>`).join("")
        : '<div class="placed-email">Drop items here</div>'}
    </div>
  `;
}

function renderFragmentButton(part) {
  const selected = appState.password.parts.includes(part);
  return `
    <button class="fragment ${selected ? "selected" : ""}" data-fragment="${part}" ${selected ? "disabled" : ""}>
      ${part}
    </button>
  `;
}

function renderToggleTile(key, title, body, active, group = "device") {
  return `
    <button class="toggle-tile ${active ? "active" : ""}" data-toggle="${key}" data-group="${group}">
      <div class="toggle-header">
        <strong>${title}</strong>
        <span class="toggle-state">${active ? "ON" : "OFF"}</span>
      </div>
      <p class="tiny-copy">${body}</p>
    </button>
  `;
}

function renderLogLine(item, selected) {
  return `
    <button class="log-line ${item.alert ? "alert" : ""} ${selected ? "selected" : ""}" data-id="${item.id}">
      <span>${item.time}</span>
      <span>${item.event}</span>
      <strong class="${item.alert ? "status-bad" : "status-good"}">${item.state}</strong>
    </button>
  `;
}

function renderIpRow(item, selected) {
  return `
    <button class="ip-row ${selected ? "selected" : ""}" data-id="${item.id}">
      <strong>${item.label}</strong>
      <span class="tiny-copy">${item.note}</span>
    </button>
  `;
}

function renderActionTile(action, selected) {
  return `
    <button class="action-tile ${selected ? "selected" : ""}" data-id="${action.id}">
      <strong>${action.title}</strong>
      <p class="tiny-copy">${action.body}</p>
    </button>
  `;
}

function bindAction(element, handler) {
  if (element) {
    element.addEventListener("click", handler);
  }
}

function toggleSetSelection(set, value) {
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function isEmailPlaced(id) {
  return appState.phishing.zones.safe.includes(id) || appState.phishing.zones.report.includes(id);
}

function isDocumentPlaced(id) {
  return appState.dataSort.zones.public.includes(id) || appState.dataSort.zones.internal.includes(id) || appState.dataSort.zones.confidential.includes(id);
}

function getEmailById(id) {
  return phishingEmails.find((mail) => mail.id === id);
}

function moveSelectedEmail(zone) {
  if (!appState.phishing.selectedId) {
    const hint = document.getElementById("phishingHint");
    if (hint) {
      hint.textContent = "Select an email first.";
    }
    return;
  }

  playSound("click");
  placeEmail(appState.phishing.selectedId, zone);
}

function moveSelectedDocument(zone) {
  if (!appState.dataSort.selectedId) {
    const hint = document.getElementById("dataHint");
    if (hint) {
      hint.textContent = "Select a document first.";
    }
    return;
  }
  playSound("click");
  moveDocument(appState.dataSort.selectedId, zone);
}

function placeEmail(emailId, zone) {
  appState.phishing.zones.safe = appState.phishing.zones.safe.filter((id) => id !== emailId);
  appState.phishing.zones.report = appState.phishing.zones.report.filter((id) => id !== emailId);

  if (zone === "safe") {
    appState.phishing.zones.safe.push(emailId);
  } else if (zone === "report") {
    appState.phishing.zones.report.push(emailId);
  }

  rerenderCurrentTask();
}

function moveDocument(documentId, zone) {
  appState.dataSort.zones.public = appState.dataSort.zones.public.filter((id) => id !== documentId);
  appState.dataSort.zones.internal = appState.dataSort.zones.internal.filter((id) => id !== documentId);
  appState.dataSort.zones.confidential = appState.dataSort.zones.confidential.filter((id) => id !== documentId);

  if (zone === "public") {
    appState.dataSort.zones.public.push(documentId);
  } else if (zone === "internal") {
    appState.dataSort.zones.internal.push(documentId);
  } else if (zone === "confidential") {
    appState.dataSort.zones.confidential.push(documentId);
  }

  rerenderCurrentTask();
}

function escapePdfText(value) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function sanitizePdfText(value) {
  return String(value || "").replace(/[^\x20-\x7E]/g, "?");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}m ${secs}s`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setTopicTheme(topic) {
  document.body.dataset.topic = topic;
  if (storyPanel) {
    storyPanel.dataset.topic = topic;
  }
}

updateSoundLabel();
renderStartScreen();
