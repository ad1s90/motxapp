const changeSelected = (e) => {
  const docRole = document.querySelector('select[name=role]');
  const docBUnit = document.querySelector('select[name=businessUnit]');
  const roleValue = document.querySelector('#myRole').value;
  const bUnitValue = document.querySelector('#myBUnit').value;
  docRole.value = roleValue;
  docBUnit.value = bUnitValue;
};
window.onload = changeSelected;
