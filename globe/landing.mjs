const query = window.location.search;
document.querySelector('#globe-frame').src = `./${query}`;
document.querySelector('#open-globe').href = `./${query}`;
