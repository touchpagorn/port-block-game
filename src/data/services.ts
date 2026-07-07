import { Question, QuestionOption } from "../types";

export interface ServiceDefinition {
  id: string;
  name: string;
  port: number;
  title: string;
  description: string;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
}

export const SERVICE_POOL: ServiceDefinition[] = [
  {
    id: "ssh",
    name: "SSH (Secure Shell)",
    port: 22,
    title: "SSH Brute Force Attack",
    description: "⚠️ ALERT: Rogue system is launching a rapid brute force attack to guess the server's root login password.",
    threatLevel: "CRITICAL",
    explanation: "Port 22 is SSH (Secure Shell). Blocking port 22 terminates all incoming remote console connections, shielding the server from the brute force run."
  },
  {
    id: "http",
    name: "HTTP (Web Server)",
    port: 80,
    title: "HTTP Flood DDoS",
    description: "🔥 CRITICAL: A distributed botnet is flooding the default unencrypted web route to overwhelm host RAM.",
    threatLevel: "HIGH",
    explanation: "Port 80 is used for unencrypted HTTP traffic. Blocking it filters out the malicious web flood, although legitimate users must transition to secure HTTPS."
  },
  {
    id: "https",
    name: "HTTPS (Secure Web)",
    port: 443,
    title: "HTTPS Handshake Attack",
    description: "💀 EXPL_ALERT: Attackers are exploiting a TLS renegotiation vulnerability to crash secure web APIs.",
    threatLevel: "HIGH",
    explanation: "Port 443 is default for secure HTTPS traffic. Blocking port 443 drops the malicious TLS handshakes to secure the server's resources."
  },
  {
    id: "ftp",
    name: "FTP (File Transfer)",
    port: 21,
    title: "FTP Plaintext Credential Sniffing",
    description: "📡 ALERT: Packet sniffing on our subnet has intercepted active corporate logins in unencrypted text.",
    threatLevel: "MEDIUM",
    explanation: "Port 21 is used for legacy FTP control sessions. Blocking port 21 stops unencrypted credential transmittals, protecting administrative sessions."
  },
  {
    id: "telnet",
    name: "Telnet Terminal Leak",
    port: 23,
    title: "Telnet Session Intercept",
    description: "📟 WARNING: High-privilege operators are configuring switches using insecure Telnet, leaking master credentials.",
    threatLevel: "HIGH",
    explanation: "Port 23 is used by Telnet. Telnet transmits all data and terminal logs in plaintext. Blocking port 23 permanently forces operators to use secure SSH instead."
  },
  {
    id: "smtp",
    name: "SMTP Mail Server",
    port: 25,
    title: "SMTP Rogue Spam Relay",
    description: "📧 SPAM_ALERT: Compromised intranet machines are abusing our mail server to relay millions of spam messages.",
    threatLevel: "MEDIUM",
    explanation: "Port 25 is standard for SMTP mail transfer. Blocking port 25 prevents unauthorized outbound email relays and spam amplification."
  },
  {
    id: "dns",
    name: "DNS Domain Resolver",
    port: 53,
    title: "DNS Amplification DDoS",
    description: "🗺️ NET_ALERT: Spoofed open recursive queries are manipulating our resolver to flood external victims.",
    threatLevel: "CRITICAL",
    explanation: "Port 53 is used by DNS. Blocking port 53 mitigates the amplification attack, blocking the reflection of spoofed lookup payloads."
  },
  {
    id: "rdp",
    name: "RDP (Remote Desktop)",
    port: 3389,
    title: "RDP Brute Force Hijack",
    description: "🔑 ALERT: Intruders are targeting RDP configurations using BlueKeep exploits to deploy network ransomware.",
    threatLevel: "CRITICAL",
    explanation: "Port 3389 is used for Windows Remote Desktop (RDP). Blocking port 3389 isolates active remote console logins and shields from the wormable exploit."
  },
  {
    id: "mysql",
    name: "MySQL Database Server",
    port: 3306,
    title: "MySQL SQL Injection Leak",
    description: "🗄️ DB_ALERT: Scanners are attempting SQL injection queries to dump our entire customer directory over port 3306.",
    threatLevel: "HIGH",
    explanation: "Port 3306 is the default port for MySQL. Blocking it drops external database connections, isolating databases from the public internet."
  },
  {
    id: "postgres",
    name: "PostgreSQL Database",
    port: 5432,
    title: "Postgres Auth Bypass",
    description: "🛢️ VULN_DETECTED: Threat actors are exploiting a misconfigured trust setting in pg_hba.conf to download metadata.",
    threatLevel: "HIGH",
    explanation: "Port 5432 is the Postgres query port. Blocking port 5432 shuts down external relational database calls to stop unauthorized data tables extraction."
  },
  {
    id: "redis",
    name: "Redis Cache Store",
    port: 6379,
    title: "Redis Unauthenticated Flush",
    description: "⚡ ALERT: Redis key store is exposed publicly. Attackers are issuing commands to purge active cache tables.",
    threatLevel: "CRITICAL",
    explanation: "Port 6379 is default for Redis. Blocking port 6379 restricts administrative caching commands, guarding application persistence layers."
  },
  {
    id: "mongodb",
    name: "MongoDB NoSQL Store",
    port: 27017,
    title: "MongoDB Ransom Wipe",
    description: "🤖 BOT_SCAN: Automated botnets are looking for public MongoDB ports to wipe database indexes and drop ransom notes.",
    threatLevel: "CRITICAL",
    explanation: "Port 27017 is used by MongoDB. Blocking port 27017 seals the public NoSQL API endpoints, stopping administrative wiping scripts."
  },
  {
    id: "smb",
    name: "SMB (Server Message Block)",
    port: 445,
    title: "SMB EternalBlue Worm",
    description: "💀 OUTBREAK_DETECTION: Ransomware worm is actively spreading laterally across the local area network using EternalBlue.",
    threatLevel: "CRITICAL",
    explanation: "Port 445 is used for SMB file shares. Blocking port 445 isolates vulnerable local shares, stopping the horizontal spread of malware."
  },
  {
    id: "ntp",
    name: "NTP Time Protocol",
    port: 123,
    title: "NTP Reflection Flood",
    description: "⏰ NET_FLOOD: Attackers are using custom monlist payloads to amplify network bandwidth traffic towards a third party.",
    threatLevel: "LOW",
    explanation: "Port 123 is NTP. Blocking port 123 stops incoming monlist requests from being weaponized into network reflection floods."
  },
  {
    id: "imap",
    name: "IMAP Email Service",
    port: 143,
    title: "IMAP Clear-Text Leak",
    description: "📩 MITM_DETECTED: Insecure IMAP sessions are being sniffed, exposing corporate inbox directories to public view.",
    threatLevel: "MEDIUM",
    explanation: "Port 143 is standard unencrypted IMAP. Blocking port 143 stops legacy email downloads, forcing secure IMAPS (993) enforcement."
  },
  {
    id: "ldap",
    name: "LDAP Active Directory",
    port: 389,
    title: "LDAP Directory Harvesting",
    description: "👥 WARNING: Anonymous user queries are scanning the active directory to harvest corporate staff aliases.",
    threatLevel: "MEDIUM",
    explanation: "Port 389 is the default LDAP port. Blocking port 389 restricts administrative directory crawls, halting target reconnaissance."
  },
  {
    id: "mssql",
    name: "MSSQL Server Engine",
    port: 1433,
    title: "MSSQL SA Password Attack",
    description: "🛡️ SYS_ALERT: Brute force scans are targeting the System Administrator account on MS-SQL default ports.",
    threatLevel: "HIGH",
    explanation: "Port 1433 is standard for Microsoft SQL Server. Blocking port 1433 prevents administrative hijacking and host operating system commands."
  },
  {
    id: "vnc",
    name: "VNC Screen Sharing",
    port: 5900,
    title: "VNC Remote Desktop Sniffing",
    description: "📺 WARNING: Unencrypted remote desktop mirror feeds are being duplicated over port 5900 to an unauthorized IP.",
    threatLevel: "HIGH",
    explanation: "Port 5900 is the default port for VNC sharing. Blocking port 5900 instantly kills active desktop scraping and session takeovers."
  }
];

// Generate randomized questions for a game session
export function generateRandomQuestions(count: number = 5): Question[] {
  // Shuffle pool to pick random unique services
  const shuffledPool = [...SERVICE_POOL].sort(() => Math.random() - 0.5);
  const selectedServices = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

  return selectedServices.map((service, roundIdx) => {
    // Generate 3 incorrect options with other realistic port numbers
    const remainingPool = SERVICE_POOL.filter(s => s.port !== service.port);
    const shuffledRemaining = remainingPool.sort(() => Math.random() - 0.5);
    const incorrectPorts = shuffledRemaining.slice(0, 3).map(s => s.port);

    // Combine correct and incorrect ports
    const allPorts = [service.port, ...incorrectPorts];
    // Shuffle the options
    const shuffledPorts = allPorts.sort(() => Math.random() - 0.5);

    const options: QuestionOption[] = shuffledPorts.map(port => {
      // Find matching service definition for description/explanation
      const optService = SERVICE_POOL.find(s => s.port === port);
      const label = `BLOCK PORT ${port}`;
      const explanation = optService 
        ? optService.explanation 
        : `Mitigates attack vector on port ${port}.`;

      return {
        code: port.toString(),
        label,
        explanation
      };
    });

    return {
      id: `round-${roundIdx + 1}-${service.id}`,
      title: `${roundIdx + 1}. ${service.title}`,
      description: service.description,
      threatLevel: service.threatLevel,
      options,
      correctCode: service.port.toString()
    };
  });
}
