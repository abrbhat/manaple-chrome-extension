function sendAttendanceData(email,authToken,attendanceData) {
  attendanceData = getAttendanceData();
  if (attendanceData == null){
    return
  }
  console.log('in send at data');
  console.log(attendanceData);
  $.each(attendanceData, function( key, value ) {
    rawImageData = value.replace(/^data\:image\/\w+\;base64\,/, '');                
    attendanceData[key] = rawImageData;
  });
  $.ajax({
        type: "POST",
        url: "http://manaple.com/api/attendance_data_upload",
        async:"true",      
        data: attendanceData,
        error: function(){
          $("#spinner").hide();
          $('#message').html("There was an error during data upload. Please try again later.");
          $("#attendance-data-stored-message").show();
        },
        success: function(data){  
          $("#spinner").hide();    
          $('#message').html("Attendance Data Stored on Server");
        },
        beforeSend: function(){
          $("#attendance-data-stored-message").hide();
          $('#message').html("Sending Attendance Data");
          $("#spinner").text("");
          var target = document.getElementById("spinner");
          var spinner = new Spinner().spin(target); 
        }
      });
}
function getAttendanceData(){
  chrome.storage.local.get('employeeData',function(result){
    return result['employeeData'];
  })
}
function setWebcam(){
  Webcam.set({
    dest_width: 400,
    dest_height: 300,
    image_format: 'jpeg',
    jpeg_quality: 90
  });
  Webcam.attach( '#webcam' );
  Webcam.setSWFLocation("/public/webcam.swf");
}
function loadEmployeeData(authEmail,authToken){
  $.ajax({
        type: "GET",
        url: "http://localhost:3000/api/get_employee_data.json",
        headers: { 'x-api-email': authEmail,
                   'x-api-token': authToken },
        error: function(){
          $("#message").html("Could not get employee data from server");
        },
        success: function(employeeData){  
          console.log(employeeData);
          chrome.storage.local.set({'employeeData':employeeData});
          populateSelectNameTag(employeeData);
        }
      });      
}
function populateSelectNameTag(employeeData){
    var selectName = document.getElementById('select-name');
    selectName.options.length = 0; // clear out existing items
    for (var userId in employeeData) {
      var employeeName = employeeData[userId];    
      selectName.options.add(new Option(employeeName, userId));  
    };
}
document.addEventListener('DOMContentLoaded', function () {
  var authToken,authEmail,attendanceData = {}, employeeId, dataUri, rawImageData, employeeData = {};
  var storage = chrome.storage.local;
  //employeeData = { '124': 'Jatin', '158': 'Manish', '781': 'Suman' };
  //storage.set({'employeeData':employeeData});
  storage.get('employeeData',function(result){
    if (result['employeeData'] != null)
    {
      employeeData = result['employeeData'];        
      $.ajax({
        type: "HEAD",
        url: "http://localhost:3000",
        error: function(){
          $("#take-photo-page").show();
          $("#take-picture-button-container").show();
          setWebcam();
          populateSelectNameTag(employeeData);
        },
        success: function(data){  
          $(".page").hide();
          $("#already-online-page").show();
          $.each(employeeData, function( key, value ) {
              $("#employee-list").append(value+"<br/>");
          });
        }
      });      
    }
    else{
      $("#no-employee-data-page").show();
    }
  });
  storage.get('attendanceData',function(result){
      if (result['attendanceData'] != null)
      {
        console.log(attendanceData);
        $("#attendance-data-stored-message").show();   
      }
  });
  
  //storage.remove(storedEmployeeData); 
    $("#take-picture-button").click(function(){    
      $("#take-picture-button-container").hide();
      $("#save-picture-and-take-another-buttons-container").show();
    	dataUri = Webcam.snap();
    	rawImageData = dataUri.replace(/^data\:image\/\w+\;base64\,/, '');
      var selectName = document.getElementById('select-name');
    	employeeId = selectName.options[selectName.selectedIndex].value;
    	$('#webcam').html('<img src="'+dataUri+'"/>');    
      attendanceData[employeeId] = dataUri;
    })
  $("#save-picture-button").click(function(){
    storage.set(attendanceData);    
    $("#save-picture-and-take-another-buttons-container").hide();
    $("#mark-another-attendance-button-container").show();
  });
  $("#mark-another-attendance-button").click(function(){
    $('#webcam').html('');  
    setWebcam();
    $("#mark-another-attendance-button-container").hide();
    $("#take-picture-button-container").show();
  });
  $("#take-another-picture-button").click(function(){
    $('#webcam').html('');  
    setWebcam();
    $("#save-picture-and-take-another-buttons-container").hide();
    $("#take-picture-button-container").show();
  })
  $(".load-employee-data-button").click(function(){
    if (authToken != null){
      loadEmployeeData(authEmail,authToken);
    }
    else{
      $(".page").hide();
      $("#login-page").show();
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
        url: "http://localhost:3000/users/sign_in.json",
        data:loginCredentials,
        error: function(){
          $("#message").html("No Internet Connectivity Present!<br/> Check your connection and try again.");
        },
        success: function(data){  
          authToken = data['user']['auth_token'];
          authEmail = data['user']['email'];
          sendAttendanceData(authEmail,authToken);
          loadEmployeeData(authEmail,authToken);
          
          $(".page").hide();
          $("#already-online-page").show();
        }
      });
  })	
  $("#send-data-to-server-button").click(function(){
    if (authToken != null){
      sendAttendanceData(email,authToken);
    }
    else{
      $(".page").hide();
      $("#login-page").show();
    }
  });
});
