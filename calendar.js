/**
* Convert number of minutes into time
*
* @param number minutes Minutes since 9am
*
* @return string Date HH:MM XX string of time
*/

function convertMinutes(minutes) {
  var hours = Math.floor(minutes/60) + 9;
  var minutes_past = minutes % 60;
  if (minutes_past < 10)
    minutes_past = "0" + minutes_past;
  var ampm = hours > 11 ? " PM" : " AM";
  return ((hours-1) % 12 + 1) + ":" + minutes_past + ampm;
}


/**
* renders calendar time labels
*/

function renderCalenderLabels() {
  var label_wrapper = document.getElementById("calendar-side-bar");
  var min_time = 9;
  var max_time = 21;
  for (var i = min_time; i <= max_time; i++) {
    // Hour
    var label_html = document.createElement("div");
    label_html.classList.add("calendar-label");
    var bold_time = document.createElement("span");
    var hour = (i-1)%12 + 1; // - 1 + 1 to account for 12pm
    var am_pm_label = i > 11 ? " PM" : " AM";
    bold_time.append(document.createTextNode(hour + ":00"));
    var ampm = document.createTextNode(am_pm_label);
    label_html.append(bold_time);
    label_html.append(ampm);
    label_wrapper.append(label_html);

    // Half Hour
    // Do not create on last time
    if (i < max_time) {
      label_html = document.createElement("div");
      label_html.classList.add("calendar-label");
      var time = document.createTextNode(hour + ":30");
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
    event.style.height = (events[i].height > 22 ? events[i].height - 22 : 0) + "px"; // minus 2 to account for borders and 20 to account for padding
    event.style.width = (events[i].width > 26 ? events[i].width - 26 : 0) + "px"; // minus 5 for left border, 1 for right border, 20 for padding
    calendar_body.appendChild(event);
  }
}


/**
* Checks to see if two events collide times
*
* @param object  eventA   First object to check
* @param object  eventB   Second object to check
*
* @return boolean whether the events collide or not
*/

function collides(eventA, eventB) {
  return (eventA.start <= eventB.start && eventA.end > eventB.start) ||
         (eventB.start <= eventA.start && eventB.end > eventA.start);
}


/**
* Recursively build event collision tree off the event index specified.
* SIDE EFFECT: Set curr_depth of each event.
*
* @param array  events       An array of events.
* @param number event_index  Index of starting event
* @param number max_width    Max width of calendar events
* @param number curr_depth   Current depth of tree branches
*
* @return object  indexes of events added to tree & max depth of tree branches
*/

function collisionTreeBuild(events, event_index, max_width, curr_depth) {
  var event = events[event_index];
  var send_depth = curr_depth + 1;

  // Check to see if event can be placed further left
  event.curr_depth = curr_depth;
  if (event.parent_node) {
    var tracked_event = event.parent_node;
    var collision_depth = [];
    while(tracked_event) {
      if (collides(tracked_event, event)) {
        if (collision_depth.indexOf(tracked_event.curr_depth) < 0)
          collision_depth.push(tracked_event.curr_depth);
      }
      tracked_event = tracked_event.parent_node;
    }
    for (var i = 0; i < curr_depth; i++) {
      if (collision_depth.indexOf(i) < 0) {
        event.curr_depth = i;
        // By truncating tree, we remove the need to go further right
        send_depth--;
        break;
      }
    }
  }
  var ret_data = {collision_indexes: [], max_depth: event.curr_depth}; // indexes & max depth

  // iterate remaining events to check collisions
  for(var i = event_index+1; i < events.length; i++) {
    if (!events[i].parent_node && collides(events[i], event)) {
      events[i].parent_node = event;
      var collision = collisionTreeBuild(events, i, max_width, send_depth);

      ret_data.max_depth = Math.max(ret_data.max_depth, collision.max_depth);
      for (var j = 0; j < collision.collision_indexes.length; j++)
        ret_data.collision_indexes.push(collision.collision_indexes[j]);
    }
  }
  ret_data.collision_indexes.push(event_index);
  return ret_data;
}


/**
* Sets the width and left attributes of passed through calendar events. attributes are set in place,
* but final array is also passed.
*
* @param array  events     An array of events.
* @param number max_width  Maximum allowed width for events
*
* @return array events     Events with width and left attributes set.
*/

function setWidthAndLeft(events, max_width) {
  var unused_events = [];

  // shallow copy events array
  for (var i = 0; i < events.length; i++) {
    unused_events.push(events[i]);
  }

  while(unused_events.length) {
    // Set width and left -- return indexes of set items
    var ret_data = collisionTreeBuild(unused_events, 0, max_width, 0);
    var remove_indexes = ret_data.collision_indexes.sort(function(a,b) {
      return b-a;
    });

    // Remove known branches to speed up process
    for (var i = 0; i < remove_indexes.length; i++) {
      var event = unused_events[remove_indexes[i]];
      event.width = Math.round(max_width / (ret_data.max_depth+1));
      event.left = event.curr_depth * event.width;
      unused_events.splice(remove_indexes[i], 1);
    }
  }

  return events;
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
    }
    formatted_events.push(event);
  }
  formatted_events = setWidthAndLeft(formatted_events, max_width);
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
* On Success, format and render events
*/

function calendarAjax() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.status = 200 && this.responseText) {
      var calendar_events = JSON.parse(this.responseText);
      var formatted_events = formatCalendarEvents(calendar_events);
      var laid_out_events = layOutDay(formatted_events);
      renderCalendarEvents(laid_out_events);
    }
  }

  xhttp.open("GET", "https://appcues-interviews.firebaseio.com/calendar/events.json", true);
  xhttp.send();
}

function testCalendar(num_events) {
  var events = {};
  num_events = num_events || 10;
  for (var i = 0; i < num_events; i++) {
    var start = Math.floor(Math.random() * 700);
    var end = Math.floor(start + Math.random() * (720 - start));
    events[i] = {start: start, end: end};
    console.log(i + " " + convertMinutes(start) + " to " + convertMinutes(end));
  }

  var calendar_body = document.getElementById("calendar-body");
  calendar_body.innerHTML = '';

  var formatted_events = formatCalendarEvents(events);
  var laid_out_events = layOutDay(formatted_events);
  renderCalendarEvents(laid_out_events);
}

renderCalenderLabels()
calendarAjax();