import { Question } from "../types";

export const CYBER_QUESTIONS: Question[] = [
  {
    id: "incident-1",
    title: "1. Ransomware Lateral Outbreak",
    description: "⚠️ Alert! Ransomware is actively encrypting local files on server Host-SRV-201 and attempting to spread across shared network drives. What is your immediate incident response?",
    threatLevel: "CRITICAL",
    correctCode: "ACTION_ISOLATE",
    options: [
      {
        code: "ACTION_ISOLATE",
        label: "Isolate Host (Disconnect Network Interface)",
        explanation: "Correct! Severing network connectivity stops the lateral spread of ransomware to other servers and backup vaults immediately."
      },
      {
        code: "ACTION_SHUTDOWN",
        label: "Gracefully Shut Down PC & Wait for IT",
        explanation: "Incorrect. Shutting down gracefully might allow active ransomware scripts to flush encryption keys, finalize file writes, or trigger deeper system locks."
      },
      {
        code: "ACTION_ANTIVIRUS",
        label: "Initiate Full Antivirus Scan on Server",
        explanation: "Incorrect. Full antivirus scans take hours and consume high CPU resources. The ransomware will finish encrypting everything long before the scan completes."
      },
      {
        code: "ACTION_RESTORE",
        label: "Trigger Cloud Backup Restoration Immediately",
        explanation: "Incorrect. Restoring backups while the network is still active is dangerous, as the active ransomware can immediately encrypt the newly restored files."
      }
    ]
  },
  {
    id: "incident-2",
    title: "2. Phishing Outbreak & Credential Leak",
    description: "📧 Urgent! Five employees have just reported that they fell for an urgent 'verify your office account' email and entered their passwords into a fake login portal. What action is required now?",
    threatLevel: "HIGH",
    correctCode: "ACTION_REVOKE_MFA",
    options: [
      {
        code: "ACTION_REVOKE_MFA",
        label: "Revoke Sessions, Force Password Reset & Audit MFA",
        explanation: "Correct! Instantly invalidating current user tokens, resetting passwords, and confirming no rogue MFA devices have been added stops the attacker from logging in."
      },
      {
        code: "ACTION_DELETE_MAIL",
        label: "Delete the Phishing Email from all Inboxes",
        explanation: "Incorrect. While deleting the email prevents *other* employees from clicking, it does not secure the accounts of the 5 employees who already leaked their credentials."
      },
      {
        code: "ACTION_BLOCK_IP",
        label: "Block the Sender's Email Domain & IP Address",
        explanation: "Incorrect. Phishers rotate sender accounts and servers continuously. More importantly, blocking the sender does not secure the leaked credentials."
      },
      {
        code: "ACTION_MONITOR_ONLY",
        label: "Monitor User Login Logs for Suspicious Activity",
        explanation: "Incorrect. Passive monitoring is too late. Attackers often automate the capture and instant exploitation of credentials using bots."
      }
    ]
  },
  {
    id: "incident-3",
    title: "3. SQL Injection & Database Leak",
    description: "🛢️ Database logs reveal a series of successful attacks containing query strings like 'admin' OR '1'='1. Highly sensitive user profiles and password hashes are leaking online. How do you patch this?",
    threatLevel: "CRITICAL",
    correctCode: "ACTION_WAF_PREPARED",
    options: [
      {
        code: "ACTION_WAF_PREPARED",
        label: "Apply WAF Rules & Implement Parameterized Queries",
        explanation: "Correct! Parameterized queries (prepared statements) treat input strictly as data rather than executable code, permanently blocking SQL injection at the application layer."
      },
      {
        code: "ACTION_REBOOT_DB",
        label: "Reboot the Web Server & Clear Memory Cache",
        explanation: "Incorrect. Rebooting does not patch the code vulnerability. The attacker can resume harvesting data as soon as the web service comes back online."
      },
      {
        code: "ACTION_ENCRYPT_DB",
        label: "Turn on Transparent Database Encryption (TDE)",
        explanation: "Incorrect. Database encryption secures data at rest (on disk), but does not prevent active SQL injection queries from pulling cleartext data via authorized web application routes."
      },
      {
        code: "ACTION_ALERT_CUSTOMERS",
        label: "Broadcast a Database Maintenance Email to Users",
        explanation: "Incorrect. Sending emails is a communication policy, but does not stop the live data breach or repair the vulnerable web route."
      }
    ]
  },
  {
    id: "incident-4",
    title: "4. Rogue Corporate Access Point",
    description: "📶 A high-strength Wi-Fi network named 'Corp_Secure_HighSpeed' has appeared inside the building. IT has verified they did not deploy it, and several employees are already connected. What is the threat response?",
    threatLevel: "MEDIUM",
    correctCode: "ACTION_ROGUE_FIND",
    options: [
      {
        code: "ACTION_ROGUE_FIND",
        label: "Locate AP Physically, Block BSSID & Force VPN",
        explanation: "Correct! Forcing corporate laptops to require VPN on all untrusted networks protects traffic, while security locates and disconnects the malicious rogue hardware."
      },
      {
        code: "ACTION_CHANGE_PASS",
        label: "Change the Official Corporate Wi-Fi Password",
        explanation: "Incorrect. Changing the official Wi-Fi password will kick legitimate users off, forcing more people onto the attacker's rogue network!"
      },
      {
        code: "ACTION_DEAUTH_ATTACK",
        label: "Launch a Continuous Wireless Deauth Flood Attack",
        explanation: "Incorrect. Continuous deauth jamming is illegal under many telecommunication laws, can cause massive interference with critical office infrastructure, and is unsafe."
      },
      {
        code: "ACTION_IGNORE_WIFI",
        label: "Ignore, since all internal communications are HTTPS anyway",
        explanation: "Incorrect. Although HTTPS encrypts app payloads, DNS queries are often leaked, certificate warnings can be bypassed, and local subnet attacks remain fully active."
      }
    ]
  },
  {
    id: "incident-5",
    title: "5. Git Public Secret Exposure",
    description: "🔑 Oops! A developer accidentally committed a live production Stripe API key to a public GitHub repository. Security logs show automated scanning bots are already hitting the API. What is the emergency fix?",
    threatLevel: "CRITICAL",
    correctCode: "ACTION_ROTATE_KEY",
    options: [
      {
        code: "ACTION_ROTATE_KEY",
        label: "Deactivate Key immediately & Rotate Credentials",
        explanation: "Correct! API keys exposed publicly must be treated as fully compromised. The only security cure is immediate revocation and rotation of a brand new secret key."
      },
      {
        code: "ACTION_DELETE_COMMIT",
        label: "Delete the Commit or Force-Push Git History",
        explanation: "Incorrect. Public scrapers clone repositories within seconds of a push. Deleting the commit from GitHub hides it from manual view, but bots already cloned the key."
      },
      {
        code: "ACTION_DELETE_REPO",
        label: "Convert the Public Repository to Private",
        explanation: "Incorrect. Making the repo private is too late. The secret key has already been scraped and logged in public commit trackers and search indices."
      },
      {
        code: "ACTION_WARNING_README",
        label: "Quickly commit a README warning asking to ignore the key",
        explanation: "Incorrect. Malicious bots and threat actors are programmed to exploit keys, not read polite markdown requests or compliance warnings."
      }
    ]
  }
];
