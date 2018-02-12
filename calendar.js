/**
* renders calendar time labels
*/
function renderCalenderLabels() {
  var label_wrapper = document.getElementById("calendar-side-bar");
  var min_time = 9;
  var max_time = 18;
  for (var i = min_time; i <= max_time; i++) {
    // Hour
    var label_html = document.createElement("div");
    label_html.classList.add("calendar-label");
    var bold_time = document.createElement("span");
    var am_pm_label = i > 11 ? " PM" : " AM";
    bold_time.append(document.createTextNode(i%12 + ":00"));
    var ampm = document.createTextNode(am_pm_label);
    label_html.append(bold_time);
    label_html.append(ampm);
    label_wrapper.append(label_html);

    // Half Hour
    // Do not create on last time
    if (i < max_time) {
      label_html = document.createElement("div");
      label_html.classList.add("calendar-label");
      var time = document.createTextNode(i%12 + ":30" + am_pm_label);
      label_html.append(time);
      label_wrapper.append(label_html);
    }
  }
}

/**
* Renders event elements on calendar
*
* @param array  events   An array of events with top, left, width, and height defined.
*
* @return object  Status object with success boolean and string message.
*/
function renderCalendarEvents(events) {
  var calendar_body = document.getElementById("calendar-body");
  
  // create event
  for (var i = 0; i < events.length; i++) {
    var event = document.createElement("div");
    event.classList.add("calendar-event");
    event.innerHTML = '<div class="event-title">Sample Item</div><div class="event-descr">Sample Location</div>';
    event.style.top = events[i].start + "px";
    event.style.left = (events[i].left + 10) + "px"; // plus 10 to account for padding
    event.style.height = (events[i].height - 22) + "px"; // minus 2 to account for borders and 20 to account for padding
    event.style.width = (events[i].width - 26) + "px"; // minus 5 for left border, 1 for right border, 20 for padding
    calendar_body.appendChild(event);
  }
}


/**
* Recursively check for event collisions
*
* @param array  events           An array of event objects.
* @param number starting_index   Where to start looking for collisions.
* @param object event            New event being checked against for collisions
* @param number collision_number Number of collisions to this point
* @param number depth            Sets how far right to put the event based on collision index
* @param number max_width        Maximum width of parent box
*
* @return number Total depth of collisions
*/
function countCollisions(events, starting_index, event, collision_number, depth, max_width) {
  var collisions = collision_number;
  for (var i = starting_index; i < events.length; i++) {
    var checked_event = events[i];
    if ( (checked_event.start < event.start && checked_event.end > event.start) ||
           (checked_event.end > event.end && checked_event.start < event.end) ) {
      collisions = countCollisions(events, i+1, event, collision_number+1, depth+1, max_width);
      checked_event.width = Math.round(max_width / (collisions + 1));
      checked_event.left = checked_event.width * depth;
    }
  }
  return collisions;
}


/**
* Lays out events for a single day
*
* @param array  events   An array of event objects. Each event object consists of a start and end
*                        time  (measured in minutes) from 9am, as well as a unique id. The
*                        start and end time of each event will be [0, 720]. The start time will 
*                        be less than the end time.
*
* @return array  An array of event objects that has the width, the left and top positions set, in addition to the id,
*                start and end time. The object should be laid out so that there are no overlapping
*                events.
*/

function layOutDay(events) {
  if (!events || !events.length) {
    console.error("layOutDay: No Events Recieved");
    return;
  }
  
  var max_width = document.getElementById("calendar-body").offsetWidth - 21; // minus 1 to account for border, 20 for padding
  var formatted_events = [];
  
  for (var i = 0; i < events.length; i++) {
    // Invalid Events are thrown out
    if (events[i].start >= events[i].end) {
      console.error("layOutDay: invalid event -- ", events[i].id);
      continue;
    }
    
    var event = {
      id: events[i].id,
      start: events[i].start,
      end: events[i].end,
      height: events[i].end - events[i].start,
      width: max_width,
      left: 0,
    }
    
    var collisions = countCollisions(formatted_events, 0, event, 0, 0, max_width);
    event.width = Math.round(max_width / (collisions + 1));
    event.left = event.width * collisions;
    formatted_events.push(event);
  }
  
  return formatted_events;
}


/**
* Converts ajax call object into array of events
*
* @param object  events  An object with id -> start/end groups. Start and end
*                        time are measured in minutes from 9am. The
*                        start and end time of each event will be [0, 720]. The start time will 
*                        be less than the end time.
*
* @return array  An array of events with id, start and end time.
*/

function formatCalendarEvents(event_dict) {
  var events_array = [];
  for (var event_id in event_dict) {
    if (event_dict.hasOwnProperty(event_id)) {
      var event = event_dict[event_id];
      events_array.push({
        id: event_id,
        start: event.start,
        end: event.end
      });
    }
  }
  
  // Sort by start time for consistency
  events_array = events_array.sort(function(a, b) {
    return a.start - b.start;
  });
  return events_array;
}


/**
* Call API to get calendar events
*
* @return object An object with id -> start/end groups. Start and end
*                time are measured in minutes from 9am. The
*                start and end time of each event will be [0, 720]. The start time will 
*                be less than the end time.
*/
function calendarAjax() {
  /* Insert AJAX Here
   *
   *
   *
   *
   *
   *
   */
    // Temp event list
    var calendar_events = {
      "-K2rlJ-nkJBtkLHL0QmO": {"end":150,"start":30},
      "-K2rlKbFfXz3OEoxRBJU": {"end":650,"start":540},
      "-K2rlLd-VjcZ_rtBlVuM": {"end":620,"start":560},
      "-K2rlMb_GD98QiMk8zGF": {"end":700,"start":630}
    }
    return calendar_events;
}


/**
* Get, format, and render calendar events
*/

function getCalendarEvents() {
  var calendar_events = calendarAjax();
  var formatted_events = formatCalendarEvents(calendar_events);
  var laid_out_events = layOutDay(formatted_events);
  renderCalendarEvents(laid_out_events);
}

renderCalenderLabels()
getCalendarEvents();