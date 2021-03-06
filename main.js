function main() {
  const HyfReposHttps = "https://api.github.com/orgs/HackYourFuture/repos";

  getAndShowRateLimit();
  getDataFromServer(HyfReposHttps, repositoriesCallback);
}

/**
 * List with all HYF repositories.
 */
var repositories = null;

/**
 * Remove all child nodes to specified parent node.
 * 
 * @param {string} parentNode 
 */
function removeChildNodes(parentNode) {
  while (parentNode.firstChild) {
    parentNode.removeChild(parentNode.firstChild);
  }
}

/**
 * Callback that handles response from server when getting repositories.
 * 
 * @param {String} data Data from server in JSON format.
 */
function repositoriesCallback(data) {
  const dataArray = JSON.parse(data);
  repositories = new Map(dataArray.map(repository => [(repository.id).toString(), repository]));
  console.log(
    `Received and parsed ${repositories.size} repositories from server.`
  );
  showRepositoriesInSelect(repositories);
  getAndShowRateLimit();
}

/**
 * Shows (renders to the DOM) all repositories in a select element.
 * 
 * @param {Object[]} repositories Array of repository objects. 
 */
function showRepositoriesInSelect(repositories) {
  const repositoriesSelectElement = document.querySelector("#repositories");

  repositoriesSelectElement.setAttribute(
    "onchange",
    "getContributors(this.value); showRepository(this.value)"
  );

  repositories.forEach(repository => {
    const optionElement = document.createElement("option");
    optionElement.setAttribute("value", repository.id);
    optionElement.innerText = repository.name;

    repositoriesSelectElement.appendChild(optionElement);
  });
}

/**
 * Shows (renders to the DOM) information about a repository.
 * 
 * @param {String} repositoryId Unique repository identifier.
 */
function showRepository(repositoryId) {
  const selectedRepository = repositories.get(repositoryId);

  const repositoryInfoElement = document.querySelector('.repository-info');
  removeChildNodes(repositoryInfoElement);
  repositoryInfoElement.innerHTML = `
    <ul>
      <li class="repository-info-item"><strong>Repository:</strong><span>${selectedRepository.name}</span></li>
      <li class="repository-info-item"><strong>Description:</strong><span>${selectedRepository.description}</span></li>
      <li class="repository-info-item"><strong>Forks:</strong><span>${selectedRepository.forks}</span></li>
      <li class="repository-info-item"><strong>Updated:</strong><span>${selectedRepository.updated_at}</span></li>
    </ul>
  `;
}

/**
 * Gets all contributors for a repository.
 * 
 * @param {String} repositoryId Unique repository identifier.
 */
function getContributors(repositoryId) {
  const selectedRepository = repositories.get(repositoryId);

  getDataFromServer(selectedRepository.contributors_url, data => {
    showContributors(data);
    getAndShowRateLimit();
  });
}

/**
 * Shows (renders to the DOM) a list of contributors.
 * 
 * @param {String} contributorsData Data about contributors in JSON format.
 */
function showContributors(contributorsData) {
  const contributors = JSON.parse(contributorsData);
  const contributorsListElement = document.querySelector(".contributors-list");
  removeChildNodes(contributorsListElement);

  contributors.forEach(contributor => {
    const listItemElement = document.createElement("li");
    listItemElement.classList.add('contributor-info-item');
    listItemElement.innerHTML = `
        <img width="100px" src="${contributor.avatar_url}">
        <span class="contributor-login">${contributor.login}</span>
        <span class="contributor-contributions">${contributor.contributions}</span>
    `;

    contributorsListElement.appendChild(listItemElement);
  });
}

/**
 * Number of allowed server requests is limited. This call is for free and gets status of this limit.
 * See more here: https://developer.github.com/v3/rate_limit/
 */
function getAndShowRateLimit() {
  getDataFromServer('https://api.github.com/rate_limit', response => {
    const rateLimitData = JSON.parse(response);
    console.log('rate-limit, remaining: ', rateLimitData.rate.remaining);
    console.log('rate-limit resets at:  ', new Date(rateLimitData.rate.reset * 1000));

    const remainingElement = document.querySelector('.remaining');
    remainingElement.innerHTML = `<strong>Remaining:</strong> ${rateLimitData.rate.remaining}`;

    const resetsAtElement = document.querySelector('.resets-at');
    const resetTimeStamp = new Date(rateLimitData.rate.reset * 1000);
    resetsAtElement.innerHTML = `<strong>New ${rateLimitData.rate.limit} given at: </strong> ${prependZeroIfNeeded(resetTimeStamp.getHours())}:${prependZeroIfNeeded(resetTimeStamp.getMinutes())}`;
  });
}

/**
 * Prepends a "0" if needed. When minutes is 5 for instance, "05" will be returned. Useful when building timestamp in format "HH:mm:ss".
 * 
 * @param {Number} timeQuantityNumber Number of minutes, hours or seconds.
 * @returns {String} The given number prepended with a zero if needed.
 */
function prependZeroIfNeeded(timeQuantityNumber) {
  return timeQuantityNumber < 10 ? "0" + timeQuantityNumber : timeQuantityNumber.toString();
}

/**
 * Gets data from an API end-point.
 * 
 * @param {String} theUrl The url to request from.
 * @param {String} callback The callback to call upon successful receive of data from server.
 */
function getDataFromServer(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open("GET", theUrl, true); // true for asynchronous
  xmlHttp.send(null);
}
