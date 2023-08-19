// const { count } = require("console");

/// To be replaced by proxy call
let params = [
  {
    "item": "Lecture sessions",
    "default": null,
    "available": 33,
    "unit": "hours"
  },
  {
    "item": "Lab sessions",
    "default": null,
    "available": 22,
    "unit": "hours"
  },
  {
    "item": "Support sessions",
    "default": null,
    "available": 44,
    "unit": "hours"
  },
  {
    "item": "Canvas activities",
    "default": null,
    "available": 55,
    "unit": "hours"
  },
  {
    "item": "Cutoff Engagement Score",
    "default": 70,
    "available": 100,
    "unit": "%"
  }
]

/// Frontend Service Failure Handler
let proxyURIs = [];
let proxyLocal = '';

let roundrobin = 0;

function loadBalancedProxyURI()
{
  if (isRunningOnCloud()) {
    roundrobin = (roundrobin++)%proxyURIs.length;
    return proxyURIs[roundrobin];
  } else {
    return proxyLocal;
  }
}

/// To be replaced by proxy
let maxminURL = "http://semmaxmin.40103709.qpc.hal.davecutting.uk";
let sortURL = "http://semsort.40103709.qpc.hal.davecutting.uk";
let scoreURL = "http://semscore.40103709.qpc.hal.davecutting.uk";
let totalURL = "http://semtotal.40103709.qpc.hal.davecutting.uk";


/// Reset generates (here) and regenerates (when clicking Clear) the input form
reset()




/// Functions (called by buttons or other functions)
function isRunningOnCloud() // GPT-3.5
{
  const localPatterns = [
    /localhost$/, /// amended to include wsl.localhost
    /^127\.0\.0\.1$/,
    /^::1$/,
    /^0\.0\.0\.0$/,
    /^.*\.local$/,
    /^.*\.dev$/,
  ];

  const hostname = window.location.hostname;

  for (const pattern of localPatterns) {
    if (pattern.test(hostname)) {
      return false; // It's running locally
    }
  }

  return true; // It's running on the cloud
}

function zero(value) {
  if (value == '') value = 0;
  return value;
}

function validateAttendances(uRL) {
  let items = [];
  let attendances = [];
  let querystring = `${uRL}?marco=polo`;
  let warningstring = '';

  for (id = 1; id <= params.length; id++) {
    let item = document.getElementById(`item_${id}`);
    let attendance = document.getElementById(`attendance_${id}`);
    items.push(item.value);
    attendances.push(zero(attendance.value));
    querystring += `&item_${id}=${items[id - 1]}&attendance_${id}=${attendances[id - 1]}`;
  };

  return { items, attendances, querystring, warningstring }
}

function countHealthy(service) {
  count = 0;
  if (service.instances) service.instances.forEach(instance => {
    if (instance.healthy) count++;
  });
  return count;
}

/// to be replaced by single display function?
function display(text) {
  document.getElementById('output-text').value = text;
}

function displayMaxMin(max_attendance, min_attendance) {
  document.getElementById('output-text').value =
    'Maximum attendance = ' + max_attendance + ' hours'
    + '\nMinimum attendance = ' + min_attendance + ' hours';
}

function displaySortedAttendance(text) {
  document.getElementById('output-text').value = text;
}

function displayTotal(total) {
  document.getElementById('output-text').value = 'Total Attendance = ' + total + ' hours';
}

function displayEngagementScore(score) {
  document.getElementById('output-text').value = 'Engagement score ' + score + ' / 1';
}

function displayRisk(risk) {
  document.getElementById('output-text').value = 'Risk of failure TBD';
}

function displayPercentages(text) {
  document.getElementById('output-text').value = 'Percentages TBC';
}

function displayError(service, message) {
  document.getElementById('output-text').value = `Error with the ${service} service: ${message}`;
  // document.getElementById('output-text').style.color = '#880000';
}


/// TODO
function get(servicename) {
  if (!isRunningOnCloud()) {
    maxminURL = "http://localhost:8001/";
  }
  if (servicename == 'maxmin') getMaxMin();
  return;
}

/// to be replaced by single get function? e.g. get('sort')
function getMaxMin() {
  const { items, attendances, querystring } = validateAttendances(maxminURL);

  console.log(querystring);

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      //let response = this.response
      var j = JSON.parse(this.response);
      if (j.error) {
        displayError("maxmin", j.message);
      } else {
        let max_attendance = j.max_item;
        let min_attendance = j.min_item;
        displayMaxMin(max_attendance, min_attendance);
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("maxmin", "the service did not respond");
    }
  };
  xhttp.open("GET", querystring);
  xhttp.send();
  return;
}

function getSortedAttendance() {

  const { items, attendances, querystring } = validateAttendances(sortURL);

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      var j = JSON.parse(this.response);
      console.log(j);
      if (j.error) {
        displayError("sort", j.message);
      } else {
        let sorted_attendance_returned = j.sorted_attendance;
        let sorted_attendance = '';
        for (let i = 0; i < sorted_attendance_returned.length; i++) {
          sorted_attendance += sorted_attendance_returned[i]['item'] 
          + ' - ' + sorted_attendance_returned[i]['attendance'] + ' hours' + '\r\n';
        }
        displaySortedAttendance(sorted_attendance);
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("sort", "the service did not respond");
    }
  }; 
  xhttp.open("GET", querystring);
  xhttp.send();
  return;
}

function getTotal() {
  const { items, attendances, querystring } = validateAttendances(totalURL);

  console.log(querystring);

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      //let response = this.response
      var j = JSON.parse(this.response);
      if (j.error) {
        displayError("total", j.message);
      } else {
        let total = parseInt(j.total);
        displayTotal(total);
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("total", "the service did not respond");
    }
  };
  xhttp.open("GET", querystring);
  xhttp.send();
  return;
}

function getEngagementScore() {
  const { items, attendances, querystring } = validateAttendances(scoreURL);

  console.log(querystring);

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      //let response = this.response
      var j = JSON.parse(this.response);
      if (j.error) {
        displayError("score", j.message);
      } else {
        let score = parseFloat(j.score).toFixed(2);
        displayEngagementScore(score);
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("score", "the service did not respond");
    }
  };
  xhttp.open("GET", querystring);
  xhttp.send();
  return;
}

function getRisk() {
  displayRisk()
  return;
}

function getPercentages() {
  displayPercentages()
  return;
}




function reset() {

  let inputsHTML = "";

  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      //let response = this.response
      var j = JSON.parse(this.response);
      console.log(j)
      if (j.error) {
        displayError("proxy", j.message);
      } else {

        let {components, standards} = j.inputs;
        let {services, proxies} = j; /// TODO use returned proxies in Task E

        /// TODO Need error handling here
        for (id = 1, index = 0; index < components.length; id++, index++) {
          inputsHTML += `<div class="input-div-1"}">
              <label class="display-item">${components[index]['item']}</label>
              <input class="display-item" type="hidden" id="item_${id}" name="item_${id}" value="${components[index]['item']}">
              <input class="display-attendance" type="number" min="0" max="${components[index]['available']}" id="attendance_${id}" name="attendance_${id}" placeholder="00" ${(components[index]['default']) ? 'value="' + components[index]['default'] + '"' : ""}><label class="out-of">/${components[index]['available']} ${components[index]['unit']}</label>
            </div>`
        }    
        for (id = components.length+1, index = 0; index < standards.length; id++, index++) {
          inputsHTML += `<div class="input-div-2"}">
              <label class="display-item">${standards[index]['item']}</label>
              <input class="display-item" type="hidden" id="item_${id}" name="item_${id}" value="${standards[index]['item']}">
              <input class="display-attendance" type="number" min="0" max="${standards[index]['available']}" id="attendance_${id}" name="attendance_${id}" placeholder="00" ${(standards[index]['default']) ? 'value="' + standards[index]['default'] + '"' : ""}><label class="out-of">/${standards[index]['available']} ${standards[index]['unit']}</label>
            </div>`
        }    
        document.getElementById('inputs').innerHTML = inputsHTML
        document.getElementById('output-text').value = '';   
        
        buttonsHTML = '';

        for (index = 0; index < services.length; index++) {
          service = services[index];
          healthy = (countHealthy(service) > 0);
          buttonsHTML+=`<div><button class="sembutton-${healthy ? '' : 'in'}active" onclick="get('${service['name']}');">${service['button']}</button></div>`
        };

        buttonsHTML += `<div><button class="sembutton-clear" onclick="reset();">Clear</button></div>`;

        console.log(buttonsHTML);

        document.getElementById('right').innerHTML = buttonsHTML;
        
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("proxy", "the service did not respond");
    }
  };

  fetch('proxyregistry.json')
  .then(response => response.json())
  .then(data => {
    console.log(data); // This will output the parsed JSON data
    proxyLocal = data.urilocal;
    proxyURIs = data.uris;
    let proxyURI = loadBalancedProxyURI()+"/status";
    console.log(proxyURI);    
    xhttp.open("GET", proxyURI);
    xhttp.send();
  })
  .catch(error => {
    console.error('Error loading JSON:', error);
  });

}

