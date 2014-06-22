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
      url: "http://manaple.com/api/upload_attendance_data.json",
      headers: { 'x-api-email': authEmail,
                 'x-api-token': authToken },
      async:"true",      
      data: {"attendance_data":attendanceData},
      error: function(xhr, status, error){
        $("#spinner").hide();
        $('#message').html("There was an error during data upload. Please try again later.");
        $("#attendance-data-stored-message").show();
      },
      success: function(data){  
        $("#spinner").hide();    
        $('#message').html("Attendance Data Stored on Server");
        chrome.storage.local.remove('attendanceData');
      },
      beforeSend: function(){
        $("#attendance-data-stored-message").hide();
        $('#message').html("Sending Attendance Data");
        $("#spinner").show();
      }
    });
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
        url: "http://manaple.com/api/get_employee_data.json",
        headers: { 'x-api-email': authEmail,
                   'x-api-token': authToken },
        async:"true",  
        error: function(){
          $("#message").html("Could not get employee data from server");
        },
        success: function(employeeData){
          chrome.storage.local.set({'employeeData':employeeData});
          populateSelectNameTag(employeeData);
          $("#employee-list").html("");
          $.each(employeeData, function( key, value ) {
              $("#employee-list").append(value+"<br/>");
          });
        }
      });      
}
function checkForInternet(loop){
  $.ajax({
        type: "HEAD",
        url: "http://manaple.com",
        async:"true",  
        error: function(){
          $("#internet-status").html("Status: Offline");
          if (loop == 'false'){ 
            $("#spinner").hide();           
            $(".page").hide();
            $("#take-photo-page").show();
          }
          else{
            setTimeout(checkForInternet, 5*1000);
          }
        },
        success: function(data){  
          $(".page").hide();
          $("#already-online-page").show();
          $("#message").html("");
          $("#internet-status").html("Status: Online");
          if (loop == 'false'){            
            $("#spinner").hide();
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
              $("#employee-list").html("");       
              $.each(employeeData, function( key, value ) {
                $("#employee-list").append(value+"<br/>");
              });  
            }
            else{
              $("#no-employee-data-page").show();
            }
          });
        },
        beforeSend: function(){
          if (loop == 'false'){
            $('#internet-status').html("Status: Checking");
            $("#spinner").show();
          }          
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
  updateAttendanceTimerCount();

  var target = document.getElementById("spinner");
  var spinner = new Spinner().spin(target); 
  storage.get('employeeData',function(result){
    if (result['employeeData'] != null)
    {
      employeeData = result['employeeData'];        
      $.ajax({
        type: "HEAD",
        url: "http://manaple.com",
        async:"true",  
        error: function(){
          $("#take-photo-page").show();
          $("#take-picture-button-container").show();
          checkForInternet('true');
          setWebcam();
          populateSelectNameTag(employeeData);
        },
        success: function(data){  
          $(".page").hide();
          $("#already-online-page").show();
          $("#employee-list").html("");
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
        $("#attendance-data-stored-message").show();   
      }
  });
  
    $("#take-picture-button").click(function(){    
      $("#take-picture-button-container").hide();
      $("#save-picture-and-take-another-buttons-container").show();
      var selectName = document.getElementById('select-name');
      employeeId = selectName.options[selectName.selectedIndex].value;
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
  $("#check-internet-connection-button").click(function(){
    checkForInternet('false');
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
        url: "http://manaple.com/users/sign_in.json",
        data:loginCredentials,
        async:"true",  
        error: function(xhr, status, error){
          $('#message').html("");
          $("#spinner").hide();
          if (xhr.status == 401){
            $("#message").html("Incorrect username or password");
          }
          else{
            $("#message").html("No Internet Connectivity Present!<br/> Check your connection and try again.");
            $(".page").hide();
            $("#take-photo-page").show();
            $("#take-picture-button-container").show();
            $("#save-picture-and-take-another-buttons-container").hide();
            $("#mark-another-attendance-button-container").hide();
            $('#webcam').html('');
            setWebcam();
            populateSelectNameTag(employeeData);
          }
        },
        success: function(data){  
          $('#message').html("");
          $("#spinner").hide();
          authToken = data['user']['auth_token'];
          authEmail = data['user']['email'];

          sendAttendanceData(authEmail,authToken);
          loadEmployeeData(authEmail,authToken);
          $(".page").hide();
          $("#already-online-page").show();
        },
        beforeSend: function(){
          $('#message').html("Signing In");
          $("#spinner").show();
        }
      });
  })	
  $("#send-data-to-server-button").click(function(){
    if (authToken != null){
      sendAttendanceData(email,authToken);
    }
    else{
      $(".page").hide();      
      $("#attendance-data-stored-message").hide();
      $("#message").html("");
      $("#login-page").show();
    }
  });
});
