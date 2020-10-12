//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}

//function to display list of encounters
function addEncounterRow(date, type, serviceProvider) {
  encounters.innerHTML += "<tr> <td>" + date + "</td><td>" + type + "</td><td>" + serviceProvider + "</td></tr>";
}

//once fhir client is authorized then the following functions can be executed
FHIR.oauth2.ready().then(function(client) {
    // get patient object and then display its demographics info in the banner
    client.request(`Patient/${client.patient.id}`).then(
      function(patient) {
        displayPatient(patient);
        console.log(patient);
      }
    );
    


  client.request(`Encounter?patient=${client.patient.id}&_sort=-date`, {
               resolveReferences: ["type", "reasonCode"], // , "participant", "serviceProvider"
               pageLimit: 0,
               flat: true
          })
          .then(
               function(encounters) {
                 console.log(encounters)
                 encounters.forEach(function(encounter) {
                     var type = encounter.type[0].text
                     var datetime = encounter.period.start
                     var date = datetime.substring(0, datetime.lastIndexOf('T'))
                     var serviceProviderReference = encounter.serviceProvider.reference
                     client.request(`${serviceProviderReference}`, {
                                  resolveReferences: ["type", "reasonCode"], // , "participant", "serviceProvider"
                                  pageLimit: 0,
                                  flat: true
                             })
                             .then(function(provider) {
                                var providerName = provider.name
                                addEncounterRow(date, type, providerName)
                             })


                 })
               }
          )

  //update function to take in text input from the app and add the note for the latest weight observation annotation
  //you should include text and the author can be set to anything of your choice. keep in mind that this data will
  // be posted to a public sandbox
  function search() {
      var zipcode = document.getElementById('zipcode').value

  //    var annotationData = {}
  //    annotationData.authorString = "Serena"
  //    annotationData.time = (new Date()).toISOString()
  //    annotationData.text = annotation
  //
  //    if (p_weight.note && p_weight.note.length) {
  //        p_weight.note.push(annotationData)
  //    }
  //    else {
  //        p_weight.note = [annotationData]
  //    }
  //
  //    client.update(p_weight, {}).then(
  //      function(ob) {
  //        p_weight = ob;
  //        displayAnnotation(annotation);
  //      });
  }

  function filterWellChildVisit(claim, productOrService){
      return claim.item.some((x) => x.productOrService.text === productOrService)
  }

  provider1Id = "520050" //
  getClaimsCountAndAvg("520050", "samaritan", "Well child visit (procedure)") // MEDEXPRESS URGENT CARE PC MASSACHUSETTS
  getClaimsCountAndAvg("520050", "medexpress", "General examination of patient (procedure)") //
  getClaimsCountAndAvg("520066", "berkshire", "Encounter for symptom") // BERKSHIRE MEDICAL CENTER INC - 1

  function getClaimsCountAndAvg(providerId, htmlProviderIdPrefix, productOrService){
  client.request(`Claim?provider=${providerId}`, {
               pageLimit: 0,
               flat: true
          })
          .then(
               function(claims) {

                 var filteredClaims = claims.filter(x=> filterWellChildVisit(x, productOrService))
                 console.log(claims.length)
                 console.log(filteredClaims.length)

                 var costs = filteredClaims.map(x => x.total.value)
                 var average_cost = costs.reduce((a, b) => (a + b)) / costs.length
                 console.log(costs)
                 console.log(average_cost)

                 document.getElementById(htmlProviderIdPrefix + "_num").innerHTML = filteredClaims.length
                 document.getElementById(htmlProviderIdPrefix + "_avg").innerHTML = "$" + average_cost.toFixed(2)
               }
          )
  }



  //event listner when the add button is clicked to call the function that will add the note to the weight observation
  document.getElementById('add').addEventListener('click', search);



}).catch(console.error);
