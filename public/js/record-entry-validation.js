function validationCheck() {
  const allAmountInputs = document.querySelectorAll('input[type="number"]');
  const allDescInputs = document.querySelectorAll('input[type="text"]');
  const submit = document.querySelector('#submit-btn');
  const validationDiv = document.querySelector('#validation-message');

  Array.from(allAmountInputs).forEach((e, i) => {
    if (e.value !== '0') {
      if (allDescInputs[i].value === '') {
        allDescInputs[i].style.border = '4px solid red';
        validationDiv.style.display = 'block';
        return (submit.disabled = true);
      } else {
        allDescInputs[i].style.border = '1px solid black';
        validationDiv.style.display = 'none';
        return (submit.disabled = false);
      }
    }
  });
}
