const deleteRecord = (btn) => {
  const recordId = btn.parentNode.querySelector('[name=recordId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  const recordElement = btn.closest('li');

  fetch('/ic/report/' + recordId, {
    method: 'DELETE',
    redirect: 'follow',
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      recordElement.remove();
    })
    .catch((err) => console.log(err));
};

const deleteGradeEntry = (btn) => {
  const userId = btn.parentNode.querySelector('[name=userId]').value;
  const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

  const recordElement = btn.closest('li');

  fetch('/grade/delete-grade-entry/' + userId, {
    method: 'DELETE',
    redirect: 'follow',
    headers: {
      'csrf-token': csrf,
    },
  })
    .then((result) => {
      return result.json();
    })
    .then((data) => {
      console.log(data);
      recordElement.remove();
    })
    .catch((err) => console.log(err));
};
