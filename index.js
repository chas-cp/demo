// Minimal entrypoint — replace with your app code
if (!process.env.EXAMPLE_VAR) {
  console.log("EXAMPLE_VAR not set — see .env.example");
  process.exit(0);
} else {
  console.log("Repo ready. EXAMPLE_VAR=", process.env.EXAMPLE_VAR);
}
