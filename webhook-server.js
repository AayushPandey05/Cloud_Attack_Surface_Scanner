const express = require("express");
const { exec } = require("child_process");
const app = express();

app.use(express.json());

// Webhook endpoint that GitHub will call
app.post("/webhook", (req, res) => {
  console.log("🔔 Received GitHub push event! Triggering deployment...");

  // Run shell commands to pull code and update Kubernetes
  exec(
    "git pull origin feature/docker-microservices && kubectl apply -f kubernetes/",
    (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Deployment error: ${error.message}`);
        return res.status(500).send("Deployment failed");
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      res.status(200).send("Deployment triggered successfully!");
    },
  );
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook listener running and listening on port ${PORT}`);
});
