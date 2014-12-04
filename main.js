/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  // Center window on screen.
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;
  var width = 1200;
  var height = 900;
  chrome.app.window.create('index.html', function(win) {
    win.onClosed.addListener(function() {
      chrome.storage.local.remove('attendanceData');
    })
  })

});

