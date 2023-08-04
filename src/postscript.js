// To be replaced by storage
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

// To be replaced by proxy
let maxminURL = "http://semmaxmin.40103709.qpc.hal.davecutting.uk/";
let sortURL = "http://semsort.40103709.qpc.hal.davecutting.uk/";

if (!isRunningOnCloud()) {
  maxminURL = "http://localhost:90/";
  sortURL = "http://localhost:100/";
}

reset()

function isRunningOnCloud() // GPT-3.5
{
  const localPatterns = [
    /localhost$/, // amended to include wsl.localhost
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
  let hasNext = true;
  let id = 1;
  let querystring = `${uRL}?marco=polo`;

  while (hasNext) {
    let item = document.getElementById(`item_${id}`);
    let attendance = document.getElementById(`attendance_${id}`);
    items.push(item.value);
    attendances.push(zero(attendance.value));
    querystring += `&item_${id}=${items[id - 1]}&attendance_${id}=${attendances[id - 1]}`
    id++;
    if (item == null || attendance == null) hasNext = false;
  };

  return { items, attendances, querystring }
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
  document.getElementById('output-text').value = 'Engagement score TBD';
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
          sorted_attendance += sorted_attendance_returned[i]['item'] + ' - ' + sorted_attendance_returned[i]['attendance'] + ' hours' + '\r\n';
        }
      }
      displaySortedAttendance(sorted_attendance);
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("sort", "the service did not respond");
    }
  }; 
  xhttp.open("GET", querystring);
  xhttp.send();
  return;
}

function getTotal() {
  const { items, attendances, querystring } = validateAttendances(sortURL);
  total = 0;
  // attendances.forEach((attendance)=>{
  //   total+=parseInt(attendance)
  // });
  displayTotal(total);
  return;
}

function getEngagementScore() {
  displayEngagementScore()
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

  let inputs1 = "";

  for (id = 1; id <= params.length; id++) {
    inputs1 += `<div class="input-div-${(params[id - 1]['default']) ? "2" : "1"}">
        <label class="display-item">${params[id - 1]['item']}</label>
        <input class="display-item" type="hidden" id="item_${id}" name="item_${id}" value="${params[id - 1]['item']}">
        <input class="display-attendance" type="number" min="0" max="${params[id - 1]['available']}" id="attendance_${id}" name="attendance_${id}" placeholder="00" ${(params[id - 1]['default']) ? 'value="' + params[id - 1]['default'] + '"' : ""}><label class="out-of">/${params[id - 1]['available']} ${params[id - 1]['unit']}</label>
      </div>`
  }

  document.getElementById('inputs').innerHTML = inputs1

  document.getElementById('output-text').value = '';
}

