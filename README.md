# Calendar Challenge

#### What is this:
Interview Challenge to create a calendar UI view to certain specifications based off a database of events which had start and end times listed as number of minutes past 9AM with a maximum of 720 minutes (9PM) allowed.

#### How To Use:
Calendar will automatically run against API to grab events.
To test further, open the browser console and type `testCalendar()` which can be supplied with a number of events to test (default: 10).
There is a minimum width to the events, so once you have > 20 collisions, things start to overlap a bit.
Refresh to reload the API.

#### Biggest Challenge:
Collisions. By far. In my first attempt, I started with a simple recursive function to find collisions.
```
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
```
This worked for simple cases, but failed when there were 3+ collisions on an event.  After some fine tuning, I eventually decided to scrap this idea and build a tree of collisions instead.  Once the tree was built, all that had to be done was to push events as far left as possible to fill in gaps.

#### Thoughts:
This was a fun piece of code!
I decided to push myself a bit and use no frameworks so I could learn a bit more about vanilla JS architecture. At some point in time I'd like to come back and put in a few other key calendar features (maybe add event/remove event?). Most interesting bit was definitely the event collision detection.  I feel like there is probably a really unique way of solving this problem which would be faster, but this setup gets the job done reasonably effectively.