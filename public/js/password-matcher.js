const matchPassword = (e) => {
  const password = document.querySelector('input[name=password]');
  const confirm = document.querySelector('input[name=passwordConfirmation]');
  if (confirm.value === password.value) {
    confirm.setCustomValidity('');
  } else {
    confirm.setCustomValidity(
      'Password i potvrđeni password se ne podudaraju! Molimo Vas da pokušate ponovo!'
    );
  }
};
