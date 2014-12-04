function signIn(email,password){
  if ((email == null) || (password == null)){    
    chrome.storage.local.get('authData',function(result){      
      if (result['authData'] != null)
      {        
        authData = result['authData'];  
        storedEmail = authData['email'];
        storedPassword = authData['password'];
        if ((storedEmail != null) && (storedPassword!=null)){
          signIn(storedEmail,storedPassword);           
        }
        else{          
          chrome.storage.local.remove('authData');
          signIn();
        }        
      }
      else{        
        showSignInForm();
      }
    });
  }
  else{    
    var loginCredentials = {
                              "email":email,
                              "password":password
                           };
    $.ajax({
          type: "POST",
          url: "http://www.manaple.com/users/sign_in.json",
          data:loginCredentials,
          async:"true",  
          error: function(xhr, status, error){
            hideSpinner();
            if (xhr.status == 401){
              setNetStatusAs('Online');
              showIncorrectAuthError();     
              chrome.storage.local.remove('authData');       
            }
            else{
              setNetStatusAs('Offline');
              clearAllMessages();
              showNoNetConnectivityError();
              hideSignInForm();
            }
          },
          success: function(data){  
            hideSpinner();
            hideSignInForm();
            authToken = data['user']['auth_token'];
            authEmail = data['user']['email'];            
            loadEmployeeData(authEmail,authToken);
            sendAttendanceData(authEmail,authToken);
          },
          beforeSend: function(){
            showSigningInMessage();
            showSpinner();
          }
      });
  }
}
function sendAttendanceData(authEmail,authToken) {
  var attendanceData = {};
  chrome.storage.local.get('attendanceData',function(result){
    attendanceData = result['attendanceData'];     
    if (attendanceData == null){
      clearAllMessages();
      return;
    }
    $.each(attendanceData, function( index, data ) {
      rawImageData = data['photo_data'].replace(/^data\:image\/\w+\;base64\,/, '');                
      attendanceData[index]['photo_data'] = rawImageData;
    });
    $.ajax({
      type: "POST",
      url: "http://www.manaple.com/api/upload_attendance_data.json",
      headers: { 'x-api-email': authEmail,
                 'x-api-token': authToken },
      async:"true",      
      data: {"attendance_data":attendanceData},
      error: function(xhr, status, error){
        hideSpinner();
        showErrorDuringDataUploadMessage();
        showAttendanceDataStoredMessage();
      },
      success: function(data){  
        hideSpinner();    
        clearAllMessages();
        hideAttendanceDataStoredOfflineMessage();
        showDataUploadSuccessfulMessage();
        chrome.storage.local.remove('attendanceData');
        $("#stored-data-table-body").html("");
      },
      beforeSend: function(){
        $('attendance-data-stored-message-container').hide();
        $('#notice-info').html("Sending Attendance Data");
        showSpinner();
      }
    });
  });  
}
function loadEmployeeData(authEmail,authToken){
  $.ajax({
        type: "GET",
        url: "http://www.manaple.com/api/get_employee_data.json",
        headers: { 'x-api-email': authEmail,
                   'x-api-token': authToken },
        async:"true",  
        error: function(){
          showEmployeeDataLoadError();
          setNetStatusAs('offline');
        },
        success: function(employeeData){
          chrome.storage.local.set({'employeeData':employeeData});
          populateSelectNameTag(employeeData);
          populateEmployeeList(employeeData);
          setNetStatusAs('Online');
          hideNoEmployeeDataOfflineError();
          clearAllErrors();
          clearAllInfoNotices();
        }
      });      
}

function setAuthDataInLocalStorage(email,password){
  chrome.storage.local.set({'authData':{'email':email,'password':password}});
}
function setWebcam(){
  $('#webcam').html('');  
  Webcam.set({
    dest_width: 400,
    dest_height: 300,
    image_format: 'jpeg',
    jpeg_quality: 90
  });
  Webcam.attach( '#webcam' );
  Webcam.setSWFLocation("/public/webcam.swf");
}
function setTakePhotoContainer(employeeData){
  $("#take-photo-container").show();
  setWebcam();
  showTakePictureButton();  
  populateSelectNameTag(employeeData);
}
function showTakePictureButton(){
  $("#save-picture-and-take-another-buttons-container").hide();
  $("#mark-another-attendance-button-container").hide();
  $("#take-picture-button-container").show();
}
function showSavePictureAndTakeAnotherButtonContainer(){
  $("#take-picture-button-container").hide();
  $("#mark-another-attendance-button-container").hide();
  $("#save-picture-and-take-another-buttons-container").show();
}
function showMarkAnotherAttendanceButton(){
  $("#save-picture-and-take-another-buttons-container").hide();
  $("#take-picture-button-container").hide();
  $("#mark-another-attendance-button-container").show();
}
function updateAttendanceTimerCount()
{ 
  chrome.storage.local.get('attendanceData',function(result){
    var attendanceData = result['attendanceData'];
    if (attendanceData != null)
    {
      $.each(attendanceData, function( index, data ) {
        attendanceData[index]['count'] = (parseInt(data['count']) + 10).toString();
      });  
      chrome.storage.local.set({'attendanceData':attendanceData});
    }    
    
  }); 
  setTimeout(updateAttendanceTimerCount, 10*1000);
} 
 

function setNetStatusAs(status){
  var textClass = 'negative-text';
  if (status == "Online"){
    textClass = "positive-text";
  }
  else if (status == "Checking"){
    textClass = "info-text";
  }
  $('#net-status').html("<span class = '"+textClass+"'>"+status+"</span>");
}
function setAttendanceDataStoredStatusAs(status){
  var textClass = 'positive-text';
  if (status == "Yes"){
    textClass = "negative-text";
  }
  $('#attendance-data-stored-status').html("<span class = '"+textClass+"'>"+status+"</span>");
}
function showAttendanceDataStoredMessage(){
  $('#attendance-data-stored-message-container').show();
  setAttendanceDataStoredStatusAs('Yes');
}
function hideAttendanceDataStoredOfflineMessage(){
  $('#attendance-data-stored-message-container').hide();
  setAttendanceDataStoredStatusAs('No');
}
function populateEmployeeList(employeeData){
  $("#employee-list").html("");
  $.each(employeeData, function( key, value ) {
      $("#employee-list").append(value+"<br/>");
  });
}
function showSignInForm(){
  $("#sign-in-form").show();
}
function hideSignInForm(){
  $("#sign-in-form").hide();
}
function showSpinner(){
  $("#spinner").show();
}
function hideSpinner(){
  $("#spinner").hide();
}
function showIncorrectAuthError(){
  clearAllMessages();
  $('#error-message').html("Incorrect Username/Password");
}
function showNoNetConnectivityError(){
  clearAllMessages();
  $('#error-message').html("No Net Connectivity Present. Please try again later.");
}
function showEmployeeDataLoadError(){
  clearAllMessages();
  $('#error-message').html("There was an error in downloading Employee Data");
}
function showNoEmployeeDataOfflineError(){
  $("#take-photo-container").hide();
  $("#no-employee-data-offline-error").show();
}
function hideNoEmployeeDataOfflineError(){
  setTakePhotoContainer();
  $("#no-employee-data-offline-error").hide();
}
function clearAllErrors(){
  $('#error-message').html('');
}
function clearAllInfoNotices(){
  $('#notice-info').html('');
}
function clearAllSuccessNotices(){
  $('#notice-success').html('');
}
function clearAllMessages(){
  clearAllErrors();
  clearAllInfoNotices();
  clearAllSuccessNotices();
}
function showSigningInMessage(){
  clearAllMessages();
  $('#notice-info').html('Signing In');
}
function showDataUploadSuccessfulMessage(){
  $('#notice-success').html('Attendance Data was successfully stored on server.');
}
function showErrorDuringDataUploadMessage(){
  clearAllMessages();
  $('#error-message').html("There was an error during data upload. Please try again later.");
}
function setNoticeAskingForSignInToGetEmployeeData(){
  clearAllMessages();
  $('#notice-info').html('Sign In to download employee data');
}
function setNoticeAskingForSignInToSendDataToServer(){
  clearAllMessages();
  $('#notice-info').html('Sign In to send data to server');
}
function addAttendanceDataInStoredDataView(attendanceData){
  rawImageData = attendanceData['photo_data'].replace(/^data\:image\/\w+\;base64\,/, ''); 
  var html = "<tr><td>"+attendanceData['employee_name'] + "</td>";
  html += '<td><img src="'+attendanceData['photo_data']+'" height="75" width="100"></img></td>';  
  html += '<td>'+attendanceData['description']+'</td>'; 
  html += '</tr>';
  $("#stored-data-table-body").append(html);
}
function checkForInternet(loop){
  $.ajax({
        type: "HEAD",
        url: "http://www.manaple.com",
        async:"true",  
        error: function(){
          setNetStatusAs('Offline');
          if (loop == 'false'){ 
            hideSpinner();         
          }
          else{
            setTimeout(checkForInternet, 5*1000);
          }
        },
        success: function(data){  
          setTakePhotoContainer();
          setNetStatusAs('Online');
          if (loop == 'false'){            
            hideSpinner();
          } 
          chrome.storage.local.get('attendanceData',function(result){
            if (result['attendanceData'] != null)
            {
              showAttendanceDataStoredMessage();
              signIn();
            }
          });
          chrome.storage.local.get('employeeData',function(result){
            if (result['employeeData'] != null)
            {
              employeeData = result['employeeData']; 
              populateEmployeeList(employeeData);
            }
            else{
              signIn();
            }
          });
        },
        beforeSend: function(){
          if (loop == 'false'){
            setNetStatusAs('Checking');
            showSpinner();
          }          
        }
  });    
}

function populateSelectNameTag(employeeData){
    if (employeeData != null){
      populateSelectTag('select-name',employeeData); 
    }
    else {
      chrome.storage.local.get('employeeData',function(result){
        if (result['employeeData'] != null)
        {
          employeeData = result['employeeData']; 
          populateSelectTag('select-name',employeeData);           
        }
        else{
          showNoEmployeeDataPage();
        }
      });
    }    
}

function populateSelectTag(tagId,data){
  var selectTag = document.getElementById(tagId);
  selectTag.options.length = 0; // clear out existing items
  for (var itemId in data) {
    var itemName = data[itemId];    
    selectTag.options.add(new Option(itemName, itemId));  
  };   
}
document.addEventListener('DOMContentLoaded', function (){
  var authToken,authEmail,authPassword,attendanceData = {}, employeeId, dataUri, rawImageData, employeeData = {};
  var storedEmail, storedPassword;
  var storage = chrome.storage.local;
  updateAttendanceTimerCount();  
  checkForInternet('true');
  var target = document.getElementById("spinner");
  var spinner = new Spinner().spin(target); 
  storage.get('authData',function(result){
    if (result['authData'] != null)
    {
      authData = result['authData'];  
      storedEmail = authData['email'];
      storedPassword = authData['password'];
    }
    else{
      showSignInForm();
    }
  });
  storage.get('employeeData',function(result){
    if (result['employeeData'] != null)
    {
      employeeData = result['employeeData'];        
      console.log (employeeData);
      setTakePhotoContainer(employeeData);
      populateEmployeeList(employeeData);   
    }
    else{
      showNoEmployeeDataOfflineError();
    }
  });
  storage.get('attendanceData',function(result){
      if (result['attendanceData'] != null)
      {
        showAttendanceDataStoredMessage();  
        var attendanceData = result['attendanceData'];     
        $.each(attendanceData, function( index, data ) {
          addAttendanceDataInStoredDataView(data);        
        });
      }      
  });  
  
  $("#take-picture-button").click(function(){    
    showSavePictureAndTakeAnotherButtonContainer();
    var selectName = document.getElementById('select-name');
    employeeId = selectName.options[selectName.selectedIndex].value;
    employeeName = selectName.options[selectName.selectedIndex].text;
    var description = "";
    var selectedDescription = $("input[type='radio'][name='attendance_description']:checked");
    if (selectedDescription.length > 0) {
        description = selectedDescription.val();
    }
  	dataUri = Webcam.snap();
  	rawImageData = dataUri.replace(/^data\:image\/\w+\;base64\,/, '');

  	$('#webcam').html('<img src="'+dataUri+'"/>');    
    attendanceData = {
                    'user_id' : employeeId,
                    'photo_data' : dataUri,
                    'employee_name':employeeName,
                    'count' : '0',
                    'description' : description
                     };
  })
  $("#save-picture-button").click(function(){
    storage.get('attendanceData',function(result){
      // Todo - send if net is there
      if (result['attendanceData'] != null)
      {
        var storedAttendanceData = result['attendanceData'];
        storedAttendanceData.push(attendanceData);
        storage.set({'attendanceData':storedAttendanceData});
      }
      else{        
        storage.set({'attendanceData':[attendanceData]});
      }
      showAttendanceDataStoredMessage();
    });   
    addAttendanceDataInStoredDataView(attendanceData);
    showMarkAnotherAttendanceButton();
    signIn();
  });
  $("#mark-another-attendance-button").click(function(){
    setTakePhotoContainer();
  });
  $("#take-another-picture-button").click(function(){
    setTakePhotoContainer();
  })
  $("#check-internet-connection-button").click(function(){
    checkForInternet('false');
  })
  $(".load-employee-data-button").click(function(){
    if (authToken != null){
      loadEmployeeData(authEmail,authToken);
    }
    else{
      setNoticeAskingForSignInToGetEmployeeData();
      showSignInForm();
    }
  });
  $("#sign-in-button").click(function(){
    var email = $("#user-email").val();
    var password = $("#user-password").val(); 
    setAuthDataInLocalStorage(email,password);    
    signIn(email,password);
  });	
  $("#send-data-to-server-button").click(function(){
    if (authToken != null){
      sendAttendanceData(authEmail,authToken);
    }
    else{
      signIn();
    }
  });
  $("#view-stored-data-button").click(function(){
    $("#show-stored-data-message").toggle();
    $("#hide-stored-data-message").toggle();
    $("#stored-data").toggle();
  });
})