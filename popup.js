function sendAttendanceData(email,authToken,attendanceData) {
  attendanceData = getAttendanceData();
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
function loadEmployeeData(authToken){
  return { '124': 'Jatin', '158': 'Manish', '781': 'Suman' } ; 
}
document.addEventListener('DOMContentLoaded', function () {
  var authToken,attendanceData = {}, employeeId, dataUri, rawImageData, employeeData = {};
  var storage = chrome.storage.local;
  employeeData = { '124': 'Jatin', '158': 'Manish', '781': 'Suman' };
  storage.set({'employeeData':employeeData});
  storage.get('employeeData',function(result){
    if (result['employeeData'] != null)
    {
      employeeData = result['employeeData'];        
      $.ajax({
        type: "HEAD",
        url: "http://manaple.com",
        error: function(){
          $("#take-photo-page").show();
          $("#take-picture-button-container").show();
          setWebcam();
          var selectName = document.getElementById('select-name');
          selectName.options.length = 0; // clear out existing items
          for (var userId in employeeData) {
            var employeeName = employeeData[userId];    
            selectName.options.add(new Option(employeeName, userId));  
          };
        },
        success: function(data){  
          console.log('here');
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
  $("#load-employee-data-button").click(function(){
    $.ajax({
        type: "HEAD",
        url: "http://manaple.com",
        error: function(){
          $("#message").html("No Internet Connectivity Present!<br/> Check your connection and try again.");
        },
        success: function(data){  
          $("#message").html("");
          $(".page").hide();
          if (authToken != null){
            loadEmployeeData(authToken);            
          }
          else{
            $("#login-page").show();
          }
          
        }
      });
  });
  $("#sign-in-button").click(function(){
    var email = $("#email").val();
    var password = $("#password").val();
    var loginCredentials = {
                            "email":email,
                            "password":password
                            };
    $.ajax({
        type: "POST",
        url: "http://manaple.com/users/sign_in.json",
        data:{"email":}
        error: function(){
          $("#message").html("No Internet Connectivity Present!<br/> Check your connection and try again.");
        },
        success: function(data){  
          authToken = data['authentication_token'];
          sendAttendanceData(email,authToken);
          loadEmployeeData(authToken);
          
          $(".page").hide();
          $("#take-photo-page").show();
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
