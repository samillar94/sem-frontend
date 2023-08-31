/// Global variables populated during setup()
let inputs = [];
let services = [];
let proxies = {};
let roundrobin = 0;


/// MAIN

/// Setup generates (on frontend start) and regenerates (when clicking Clear) the input form

// document.cookie = "s1=70;"
setup(true)


/// FUNCTIONS

function setup(keepdata) {

  let inputsHTML = "";

  /// Define request to sem-watcher
  let xhttpW = new XMLHttpRequest();
  xhttpW.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      var j = JSON.parse(this.response);
      console.log(j)
      if (!j.tests) {
        displayError(`The monitoring service returned an error: ${j.message}`);
      } else {

        displayResult("Checking monitoring service...")

        serviceMetrics = j.tests

        for (const [serviceName, serviceTests] of Object.entries(serviceMetrics)) {

          className = "active";

          try {

            for (const [testName, testResults] of Object.entries(serviceTests)) {

              if (!testResults.working) {
                className = "inactive"
                break;
              }

              if (!testResults.passed) {
                className = "failed";
                break;
              }
              
              className = "passed";

            }

          } catch {
            console.log("Issue with the monitoring results")
          }

          document.getElementById(serviceName+'-button').className = className

        };        

        clearResult();
        
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayWarning("The monitoring service did not respond");
    }

  };

  /// Define request to sem-proxy
  let xhttpP = new XMLHttpRequest();
  xhttpP.onreadystatechange = function () {
    console.log(this.readyState);
    if (this.readyState == 4 && this.status == 200) {
      var j = JSON.parse(this.response);
      console.log(j)
      if (j.error) {
        displayError(`The proxy returned an error on the /status route: ${j.message}`);
      } else {

        ({inputs, services} = j); /// saves to global variables

        let {components, standards} = inputs;

        for (id = 1, index = 0; index < components.length; id++, index++) {
          inputsHTML += `<div class="input-div-1"}">
              <label class="display-item">${components[index]['item']}</label>
              <input class="display-item" type="hidden" id="item_${id}" name="item_${id}" value="${components[index]['item']}">
              <input class="display-attendance" type="number" min="0" max="${components[index]['availability']}" id="attendance_${id}" name="attendance_${id}" placeholder="00" ${(components[index]['default']) ? 'value="' + components[index]['default'] + '"' : ""}><label class="out-of">/ ${components[index]['availability']} ${components[index]['unit']}</label>
            </div>`
        }    
        for (id = components.length+1, index = 0; index < standards.length; id++, index++) {
          inputsHTML += `<div class="input-div-2"}">
              <label class="display-item">${standards[index]['item']}</label>
              <input class="display-item" type="hidden" id="item_${id}" name="item_${id}" value="${standards[index]['item']}">
              <input class="display-attendance" type="number" min="0" max="${standards[index]['availability']}" id="attendance_${id}" name="attendance_${id}" placeholder="00" ${(standards[index]['default']) ? 'value="' + standards[index]['default'] + '"' : ""}><label class="out-of">/ ${standards[index]['availability']} ${standards[index]['unit']}</label>
            </div>`
        }    
        document.getElementById('inputs').innerHTML = inputsHTML
        document.getElementById('results').innerHTML = '';
        clearResult();
        clearError();
        clearWarning();
   
        buttonsHTML = '';

        for (index = 0; index < services.length; index++) {
          service = services[index];
          open = (countOpen(service) > 0);
          buttonsHTML+=`<div><button class="${open ? '' : 'in'}active" id="${service['name']}-button" onclick="get('${service['name']}');">${service['button']}</button></div>`
        };

        buttonsHTML += `<div><button class="clear" onclick="setup(false);">Clear</button></div>`;

        // console.log(buttonsHTML);

        document.getElementById('right').innerHTML = buttonsHTML;
        
      }
    } else if (this.readyState == 4 && this.status != 200) {
      displayError("The proxy service did not respond");
    }

    /// Get sem-watcher when this is done
    xhttpW.open("GET", "http://34.142.88.78");
    xhttpW.send();
  
  };

  /// Load proxyregistry, then get proxy, then get watcher
  fetch('proxyregistry.json')
  .then(response => response.json())
  .then(data => {

    proxies.proxyLocal = data.urilocal;
    proxies.proxyURIs = data.uris;
    let proxyURI = loadBalancedProxyURI()+"/status";
    console.log("Getting configuration from proxy at: "+proxyURI);    

    xhttpP.open("GET", proxyURI);
    xhttpP.send();

  })
  .catch(error => {
    console.error('Error loading JSON:', error);
  });

};


function loadBalancedProxyURI() {
  /**
   * Task D
   */

  let { proxyURIs, proxyLocal } = proxies;

  let proxyURI = proxyLocal;

  if (isRunningOnCloud()) {
    console.log(proxyURIs)
    console.log(roundrobin)
    (roundrobin++)%=proxyURIs.length;
    console.log(roundrobin)
    proxyURI = proxyURIs[roundrobin];
    console.log(proxyURI)
  } 

return proxyURI }


function isRunningOnCloud() {

  const localPatterns = [
    /**
     * Generated by GPT-3.5
     */    
    /localhost$/, /// amended to include wsl.localhost
    /^127\.0\.0\.1$/,
    /^::1$/,
    /^0\.0\.0\.0$/,
    /^.*\.local$/,
    /^.*\.dev$/,
  ];

  const hostname = window.location.hostname;

  let result = true; // It's running on the cloud

  for (const pattern of localPatterns) {
    /**
     * Generated by GPT-3.5
     */     
    if (pattern.test(hostname)) {
      result = false;
      break; // It's running locally
    }
  }

return result }


function readInput(servicename) {

  let result = {};
  let querystring = `${loadBalancedProxyURI()}?service=${servicename}`;
  let warnings = [];
  let errors = [];

  for (id = 1; id <= inputs.components.length; id++) {

    let index = id - 1;
    let {item, availability, unit} = inputs.components[index];
    let attendance = document.getElementById(`attendance_${id}`).value;

    if (attendance == '') {

      attendance = 0;
      warnings.push(`No input for ${item} - interpreted as 0`);

    } else if (parseFloat(attendance) != NaN) {

      attendance = parseFloat(attendance);

      if (attendance < 0) {
        errors.push(`${item} cannot be negative`);
      } else if (attendance > parseFloat(availability)) {
        warnings.push(`Large input for ${item} - interpreted as ${availability} ${unit}`);
        attendance = availability;
      }

    } else {

      errors.push(`${item} must be a number between 0 and ${availability}`);

    }

    querystring += `&a${id}=${attendance}`;

  }

  let cutoff = document.getElementById(`attendance_5`).value;

  if (cutoff == '') {

    cutoff = 0;
    warnings.push(`No input for cutoff - interpreted as 0`);

  } else if (parseFloat(cutoff) != NaN) {

    cutoff = parseFloat(cutoff);

    if (cutoff < 0) {
      errors.push(`Cutoff cannot be negative`);
    } else if (cutoff > 100) {
      errors.push(`Cutoff cannot be greater than 100%`);
    }

  } else {

    errors.push(`${item} must be a number between 0 and 100`);

  }

  querystring += `&c=${cutoff}`;

  /// result construction
  if (errors.length == 0) {
    result = {querystring};
  } else {
    result = {errors};
  }

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  console.log(result)

return result }


function countOpen(service) {
  count = 0;
  if (service.instances) service.instances.forEach(instance => {
    if (instance.open) count++;
  });
return count }


function displayResult(result) {
  clearError();
  document.getElementById('results').innerHTML += `<p>${result}</p>`;
return }


function displayWarning(warning) {
  document.getElementById('warnings').style.display = "block";
  document.getElementById('warnings').innerHTML += `<p>${warning}</p>`;
return }


function displayError(error) {  
  document.getElementById('errors').style.display = "block";
  document.getElementById('errors').innerHTML += `<p>${error}</p>`;
return }


function clearResult() {
  document.getElementById('results').innerHTML = `<p>Enter values above and click a button to show results here</p>`;
return }


function clearWarning() {
  document.getElementById('warnings').style.display = "none";
  document.getElementById('warnings').innerHTML = '';
return }


function clearError() {  
  document.getElementById('errors').style.display = "none";
  document.getElementById('errors').innerHTML = '';
return }


function get(servicename) {

  const result = readInput(servicename);

  document.getElementById('results').innerHTML = 'Calculating...'; 
  document.getElementById('warnings').innerHTML = '';   
  document.getElementById('errors').innerHTML = '';   

  if (result.warnings) {

    result.warnings.forEach(line => displayWarning(line));

  }

  if (result.errors) {

    result.errors.forEach(line => displayError(line));
    document.getElementById('results').innerHTML = '';

  } else {

    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {

      console.log(this.readyState);

      if (this.readyState == 4 && this.status == 200) {

        try {
          var j = JSON.parse(this.response);
        } catch {
          displayError(`The ${servicename} service returned invalid JSON: ${this.response}`);
        }
        console.log(j);

        document.getElementById('results').innerHTML = '';

        if (j.error) {
          displayError(`The ${servicename} service returned an error: ${j.message}`);
        } else {
          j.lines.forEach(line => displayResult(line));
        }

      } else if (this.readyState == 4 && this.status != 200) {

        document.getElementById('results').innerHTML = '';
        displayError(`The ${servicename} service did not respond: ${this.response}`);

      }

    }

    xhttp.open("GET", result.querystring);
    xhttp.send();

  }
    
return }

