// get the form element and all radio inputs inside it
const form = document.getElementById('riasec-test');
const radioInputs = form.querySelectorAll('input[type="radio"]');

// initialize the RIASEC scores
let R = 0, I = 0, A = 0, S = 0, E = 0, C = 0;

// loop over all radio inputs
radioInputs.forEach(input => {
  // if the input is checked, add its value to the corresponding RIASEC score
  if (input.checked) {
    switch (input.name) {
      case 'q1':
      case 'q2':
      case 'q3':
      case 'q4':
        R += parseInt(input.value);
        break;
      case 'q5':
      case 'q6':
        I += parseInt(input.value);
        break;
      case 'q7':
        A += parseInt(input.value);
        break;
      case 'q8':
      case 'q9':
        S += parseInt(input.value);
        break;
      case 'q10':
      case 'q11':
        E += parseInt(input.value);
        break;
      case 'q12':
      case 'q13':
      case 'q14':
      case 'q15':
      case 'q16':
        C += parseInt(input.value);
        break;
    }
  }
});

// output the RIASEC scores
console.log(`R: ${R}, I: ${I}, A: ${A}, S: ${S}, E: ${E}, C: ${C}`);
