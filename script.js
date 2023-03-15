const riasecTypes = {
    R: { name: "Realistic", questions: [1, 7,14 ] },
    I: { name: "Investigative", questions: [2, 11, ] },
    A: { name: "Artistic", questions: [3, 8, ] },
    S: { name: "Social", questions: [4,12,13 ] },
    E: { name: "Enterprising", questions: [5, 10 ] },
    C: { name: "Conventional", questions: [6, 9] }
  };
  
  const questions = [
"1: I like to work on cars",
"2: I like to do puzzles",
"3:I am good at working independently",
"4:I like to work in teams",
"5:I am an ambitious person,I set goals for myself",
"6:I like to organize things, (files, desks/offices)",
"7:I like to build things",
"8:I like to read about art and music",
"9:I like to have clear instructions to follow",
"10: I like to try to influence or persuade people",
"11:I like to do experiments",
"12:I like to teach or train people",
"13:I like trying to help people solve their problems",
"14:I like to take care of animals"
  ];
  const scores = {
    1: { R: 3, I: 0, A: 0, S: 0, E: 0, C: 0 },
    2: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 0 },
    3: { R: 0, I: 0, A: 3, S: 0, E: 0, C: 0 },
    4:{ R: 0, I: 0, A: 0, S: 3, E: 0, C: 0 },
    5: { R: 0, I: 0, A: 0, S: 0, E: 3, C: 0 },
    6: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 3 },
    7:{ R: 3, I: 0, A: 0, S: 0, E: 0, C: 0 },
    8: { R: 0, I: 0, A: 3, S: 0, E: 0, C: 0 },
    9: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 3 },
    10:{ R: 0, I: 0, A: 0, S: 0, E: 3, C: 0 },
    11: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 0 },
    12: { R: 0, I: 0, A: 0, S: 3, E: 0, C: 0 },
    13: { R: 0, I: 3, A: 0, S: 3, E: 0, C: 0 },
    14: { R: 3, I: 0, A: 0, S: 0, E: 0, C: 0 },
    
  };
  
  function calculateScores(answers) {
    const scores = {};
  
    // Initialize scores to 0
    Object.keys(riasecTypes).forEach(type => {
      scores[type] = 0;
    });
  
    // Add answer scores to type scores
    answers.forEach(answer => {
      const { question, response } = answer;
      Object.keys(scores).forEach(type => {
        scores[type] += response * scores[question][type];
      });
    });
  
    return scores;
  }
  function displayScores(scores) {
    const resultDiv = document.getElementById("results");
    resultDiv.innerHTML = "";
  
    // Find the RIASEC type with the highest score
    let maxType = "";
    let maxScore = -Infinity;
    Object.entries(scores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxType = type;
        maxScore = score;
      }
    });
  
    // Create a header to display the RIASEC type with the highest score
    const header = document.createElement("h2");
    header.textContent = `Your top RIASEC type is ${riasecTypes[maxType].name}`;
    resultDiv.appendChild(header);
  
    // Create a table to display the scores for each RIASEC type
    const table = document.createElement("table");
    table.innerHTML = `
      <tr>
        <th>RIASEC Type</th>
        <th>Score</th>
      </tr>
    `;
    Object.entries(scores).forEach(([type, score]) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${riasecTypes[type].name}</td>
        <td>${score}</td>
      `;
      table.appendChild(row);
    });
    resultDiv.appendChild(table);
  }
  

  const form = document.getElementById("riasec-test");
  const Button = document.querySelector("#submit-btn");


// Add an event listener to the submit button
submitButton.addEventListener("click", function(event) {
  // Prevent the default form submission behavior
  event.preventDefault();
  
  // Get the values of the form elements
  const answers = [];
  const inputs = form.elements;
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input.type === "radio" && input.checked) {
      answers.push({ question: input.name, response: parseInt(input.value) });
    }
  }
  
  // Calculate the scores and display the results
  const scores = calculateScores(answers);
  displayScores(scores);
});
  