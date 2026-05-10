# Cloud Attack Surface Scanner — DevOps Project

This adds 5 DevOps tools to the existing scanner project.

---

## What each tool does

| Tool | What it does in this project |
|---|---|
| Terraform | Creates the S3 buckets on AWS automatically |
| Kubernetes | Runs and manages the scanner app in containers |
| GitHub Actions | Automatically tests and builds the code on every push |
| Ansible | Sets up the server (installs Docker, Node.js) |
| Prometheus + Grafana | Shows live graphs of the scanner's findings |

---

## How to use each tool

### 1. Terraform — Create the AWS buckets

```bash
cd terraform/
terraform init
terraform apply
```

This creates two S3 buckets:
- `scanner-safe-bucket` — has public access blocked (good)
- `scanner-unsafe-bucket` — has public access open (bad, so the scanner finds it)

### 2. Kubernetes — Run the app

```bash
cd kubernetes/
kubectl apply -f deployment.yaml
kubectl get pods        # check it's running
```

### 3. GitHub Actions — Automatic testing

This runs automatically when you push to GitHub.
The workflow file is at `github-actions/pipeline.yml`.

Copy it to the right place in your project:
```bash
mkdir -p .github/workflows
cp github-actions/pipeline.yml .github/workflows/pipeline.yml
git add . && git commit -m "add CI/CD pipeline" && git push
```

Now every push automatically runs `npm install` and `npm audit`.

### 4. Ansible — Setup the server

```bash
cd ansible/

# Edit hosts.ini and put in your server IP first
nano hosts.ini

# Then run:
ansible-playbook -i hosts.ini setup.yml
```

This installs Docker and Node.js on your server automatically.

### 5. Prometheus + Grafana — See live metrics

```bash
cd monitoring/
docker compose up
```

Then open your browser:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (username: `admin`, password: `admin`)

In Grafana, go to **Dashboards → Import** and upload the file `grafana/scanner-dashboard.json`.

---

## Folder structure

```
scanner_devops/
├── terraform/
│   └── main.tf                  creates the S3 buckets
├── kubernetes/
│   └── deployment.yaml          runs the app in Kubernetes
├── github-actions/
│   └── pipeline.yml             CI/CD pipeline
├── ansible/
│   ├── setup.yml                installs Docker + Node.js on server
│   └── hosts.ini                list of servers
└── monitoring/
    ├── docker-compose.yml       starts Prometheus + Grafana
    └── prometheus/
        └── prometheus.yml       tells Prometheus what to monitor
```
