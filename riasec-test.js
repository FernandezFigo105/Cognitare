// Define the RIASEC scores
const riasecScores = {
    "Realistic": 0,
    "Investigative": 0,
    "Artistic": 0,
    "Social": 0,
    "Enterprising": 0,
    "Conventional": 0
  };
  
  // Define the scoring key
  const scoringKey = {
    "q1": { "1": "Realistic", "2": "Realistic", "3": "Neutral", "4": "Artistic", "5": "Artistic" },
    "q2": { "1": "Investigative", "2": "Investigative", "3": "Neutral", "4": "Enterprising", "5": "Enterprising" }
    // Add more scoring keys here
  };
  
  // Calculate the RIASEC scores
  function calculateScores(answers) {
    answers.forEach(answer => {
      const score = scoringKey[answer.question][answer.response.toString()];
      riasecScores[score]++;
    });
    return riasecScores;
  }
  
  // Display the RIASEC scores
  function displayScores(scores) {
    const results = document.createElement("div");
    results.innerHTML = `
      <h2>RIASEC Results</h2>
      <ul>
        <li>Realistic: ${scores.Realistic}</li>
        <li>Investigative: ${scores.Investigative}</li>
        <li>Artistic: ${scores.Artistic}</li>
        <li>Social: ${scores.Social}</li>
        <li>Enterprising: ${scores.Enterprising}</li>
        <li>Conventional: ${scores.Conventional}</li>
      </ul>
    `;
    document.body.appendChild(results);
  }
  
  // Get a reference to the form and submit button
  const form = document.getElementById("riasec-test");
  const submitButton = document.getElementById("submit-btn");
  
  // Add an event listener to the submit button
  submitButton.addEventListener("click", event => {
    event.preventDefault();
  
    // Get the selected answers
    const answers = [];
    const inputs = form.querySelectorAll("input[type='radio']:checked");
    inputs.forEach(input => {
      const answer = {
        "question": input.name,
        "response": input.value
      };
      answers.push(answer);
    });
  
    // Calculate the scores and display the results
    const scores = calculateScores(answers);
    displayScores(scores);
  });
  