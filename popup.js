function sendAttendanceData(authEmail,authToken) {
  var attendanceData = {};
  chrome.storage.local.get('attendanceData',function(result){
    attendanceData = result['attendanceData'];     
    if (attendanceData == null){
      return
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
        $('#message').html("There was an error during data upload. Please try again later.");
        $("#attendance-data-stored-message").show();
      },
      success: function(data){  
        hideSpinner();    
        $('#message').html("Attendance Data Stored on Server");
        chrome.storage.local.remove('attendanceData');
        $("#stored-data-table-body").html("");
      },
      beforeSend: function(){
        $("#attendance-data-stored-message").hide();
        $('#message').html("Sending Attendance Data");
        showSpinner();
      }
    });
  })  
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
function setTakePhotoPage(employeeData){
  $(".page").hide();
  $("#take-photo-page").show();
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
 
function loadEmployeeData(authEmail,authToken){
  $.ajax({
        type: "GET",
        url: "http://www.manaple.com/api/get_employee_data.json",
        headers: { 'x-api-email': authEmail,
                   'x-api-token': authToken },
        async:"true",  
        error: function(){
          $("#message").html("Could not get employee data from server");
        },
        success: function(employeeData){
          chrome.storage.local.set({'employeeData':employeeData});
          populateSelectNameTag(employeeData);
          populateEmployeeList(employeeData);
        }
      });      
}
function populateEmployeeList(employeeData){
  $("#employee-list").html("");
  $.each(employeeData, function( key, value ) {
      $("#employee-list").append(value+"<br/>");
  });
}
function showLoginPage(){
  $(".page").hide();
  $("#login-page").show();
}
function showNoEmployeeDataPage(){
  $(".page").hide();
  $("#no-employee-data-page").show();
}
function showSpinner(){
  $("#spinner").show();
}
function hideSpinner(){
  $("#spinner").hide();
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
          $("#internet-status").html("Status: Offline");
          if (loop == 'false'){ 
            hideSpinner();           
            setTakePhotoPage();
          }
          else{
            setTimeout(checkForInternet, 5*1000);
          }
        },
        success: function(data){  
          setTakePhotoPage();
          $("#message").html("");
          $("#internet-status").html("Status: Online");
          if (loop == 'false'){            
            hideSpinner();
          } 
          chrome.storage.local.get('attendanceData',function(result){
            if (result['attendanceData'] != null)
            {
              $("#attendance-data-stored-message").show();   
            }
          });
          chrome.storage.local.get('employeeData',function(result){
            if (result['employeeData'] != null)
            {
              employeeData = result['employeeData']; 
              populateEmployeeList(employeeData);
            }
            else{
              showNoEmployeeDataPage();
            }
          });
        },
        beforeSend: function(){
          if (loop == 'false'){
            $('#internet-status').html("Status: Checking");
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
document.addEventListener('DOMContentLoaded', function () {
  var authToken,authEmail,attendanceData = {}, employeeId, dataUri, rawImageData, employeeData = {};
  var storage = chrome.storage.local;
  updateAttendanceTimerCount();

  var target = document.getElementById("spinner");
  var spinner = new Spinner().spin(target); 
  storage.get('employeeData',function(result){
    if (result['employeeData'] != null)
    {
      employeeData = result['employeeData'];        
      $.ajax({
        type: "HEAD",
        url: "http://www.manaple.com",
        async:"true",  
        error: function(){
          setTakePhotoPage(employeeData);
          checkForInternet('true');
        },
        success: function(data){  
          setTakePhotoPage(employeeData);
          populateEmployeeList(employeeData);
        }
      });      
    }
    else{
      showNoEmployeeDataPage();
    }
  });
  storage.get('attendanceData',function(result){
      if (result['attendanceData'] != null)
      {
        $("#attendance-data-stored-message").show();   
      }
      var attendanceData = result['attendanceData'];     
      $.each(attendanceData, function( index, data ) {
        addAttendanceDataInStoredDataView(data);        
      });
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
      if (result['attendanceData'] != null)
      {
        var storedAttendanceData = result['attendanceData'];
        storedAttendanceData.push(attendanceData);
        storage.set({'attendanceData':storedAttendanceData});
      }
      else{        
        storage.set({'attendanceData':[attendanceData]});
      }
      $("#attendance-data-stored-message").show();  
    });   
    addAttendanceDataInStoredDataView(attendanceData);
    showMarkAnotherAttendanceButton();
  });
  $("#mark-another-attendance-button").click(function(){
    setTakePhotoPage();
  });
  $("#take-another-picture-button").click(function(){
    setTakePhotoPage();
  })
  $("#check-internet-connection-button").click(function(){
    checkForInternet('false');
  })
  $(".load-employee-data-button").click(function(){
    if (authToken != null){
      loadEmployeeData(authEmail,authToken);
    }
    else{
      showLoginPage();
    }
  });
  $("#sign-in-button").click(function(){
    var email = $("#user-email").val();
    var password = $("#user-password").val();
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
          $('#message').html("");
          hideSpinner();
          if (xhr.status == 401){
            $("#message").html("Incorrect username or password");
          }
          else{
            $("#message").html("No Internet Connectivity Present!<br/> Check your connection and try again.");
            setTakePhotoPage(employeeData);
          }
        },
        success: function(data){  
          $('#message').html("");
          hideSpinner();
          authToken = data['user']['auth_token'];
          authEmail = data['user']['email'];
          sendAttendanceData(authEmail,authToken);
          loadEmployeeData(authEmail,authToken);
          setTakePhotoPage(employeeData);
        },
        beforeSend: function(){
          $('#message').html("Signing In");
          showSpinner();
        }
      });
  })	
  $("#send-data-to-server-button").click(function(){
    if (authToken != null){
      sendAttendanceData(authEmail,authToken);
    }
    else{   
      $("#message").html("");
      showLoginPage();
    }
  });
  $("#view-stored-data-button").click(function(){
    $("#show-stored-data-message").toggle();
    $("#hide-stored-data-message").toggle();
    $("#stored-data").toggle();
  })
});
