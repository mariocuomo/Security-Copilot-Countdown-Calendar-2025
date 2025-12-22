# Security Copilot Skills Visualizer

A tool to visualize and analyze Microsoft Security Copilot Skills in a clear and intuitive way.

## 📋 Project Overview

Microsoft Security Copilot leverages **Skills** to answer user queries and extend its capabilities through custom plugins. These Skills are the building blocks that enable Copilot to perform tasks such as:

- Running KQL queries
- Invoking GPT-based reasoning
- Interacting with MCP servers
- Triggering Logic Apps
- Engaging agents

However, in my experience, having a complete view of all available Skills in Security Copilot is challenging. While the product provides an internal UI, it is not particularly user-friendly for gaining a holistic understanding.

### Goal

The purpose of this personal project is to **visualize the set of Skills implemented in Security Copilot**, focusing in this first Proof of Concept on custom Skills only. The tool allows you to see which Skills belong to categories like KQL, GPT, MCP, Logic App, and Agent, giving a clear understanding of what has been deployed.

## 🚀 Features

### 1. Skills Visualizer (`index.html`)

The main page allows you to:

- **Upload YAML files** containing custom plugins
- **Search skills/plugins** by name
- **Apply UI-based filters** to quickly narrow down categories (KQL, GPT, MCP, Logic App, Agent)
- **View in an organized way** all loaded Skills

<div align="center">
  <img src="https://github.com/mariocuomo/Security-Copilot-Countdown-Calendar-2025/blob/main/img/PVskills.png" width="1000"> </img>
</div>

### 2. Skills Graph Analyzer (`graph-view.html`)

An advanced feature that works as a **visual workflow designer** based on the Skills currently available in Security Copilot. It enables you to:

- **Visually map workflows** using a graphical interface
- **Reason collaboratively** about how Copilot could execute workflows using existing Skills
- **Export and import graphs** in JSON format to collaborate with colleagues
- **Share workflow projects** with the team

<div align="center">
  <img src="https://github.com/mariocuomo/Security-Copilot-Countdown-Calendar-2025/blob/main/img/PVgraph.png" width="1000"> </img>
</div>

## 📁 Project Structure

```
.
├── index.html                                  # Main page - Skills Visualizer
├── graph-view.html                             # Skills Graph Analyzer
├── security-copilot-graph-2025-11-21.json     # Example of exported graph
├── plugins/                                    # Sample YAML plugins (non-working)
│   ├── EmailNotifications.yaml
│   ├── HighRiskUsers.yaml
│   ├── IncidentAnalysis.yaml
│   ├── LogAnalytics.yaml
│   └── ThreatHunting.yaml
└── README.md
```

### Sample Files

- **`plugins/`**: Contains sample YAML plugins (fake, non-working) to test the tool
- **`security-copilot-graph-2025-11-21.json`**: An example of an exported graph that can be imported into the Graph Analyzer

## 🎯 How to Use

### Skills Visualizer

1. Open `index.html` in your browser
2. Upload one or more YAML files containing Skills definitions
3. Use the search bar to filter by name
4. Apply category filters to view specific types of Skills

### Skills Graph Analyzer

1. Open `graph-view.html` in your browser
2. Create a new graph or import an existing one (e.g., `security-copilot-graph-2025-11-21.json`)
3. Add nodes and connections to map the workflow
4. Export the graph to JSON to share it with your team
5. Collaborate with colleagues by importing and editing shared graphs

## ⚠️ Current Limitations

- **Asynchronous operation**: The tool works offline with respect to Security Copilot's content
- **No dynamic APIs**: Does not use APIs to retrieve Skills dynamically
- **Offline analysis**: Relies on manual upload of Skill manifests
- **Proof of Concept**: Focused on custom Skills

### Security Note

Although technically it is possible to extract all Skills from Security Copilot using custom scripts, this approach is **not officially supported** and may introduce risks or break compliance with best practices. For this reason, the project focuses on a safe and transparent visualization process based on manual manifest uploads.

## 💡 Recommendations

- Adopt a **cautious CI/CD process** for deploying Skills in Security Copilot
- Use the tool to **document and visualize** deployed Skills
- Leverage the Graph Analyzer for **collaborative workflow design sessions**
- Keep YAML files and JSON graphs under **version control**

## 🛠️ Technologies

- HTML5
- JavaScript
- No external dependencies
- Runs completely client-side


## 🤝 Contributions

This is a personal project and a Proof of Concept. Feedback and suggestions are always welcome!

---

**Note**: The files in the `plugins/` folder are fake examples provided for demonstration purposes only and are not functional in a real Security Copilot environment.

