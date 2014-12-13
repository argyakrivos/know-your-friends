// Remove the ugly Facebook appended hash
// <https://github.com/jaredhanson/passport-facebook/issues/12>
if (window.location.hash && window.location.hash === "#_=_") {
  if (window.history && history.pushState) {
    window.history.pushState("", document.title, window.location.pathname);
  } else {
    // Prevent scrolling by storing the page's current scroll offset
    var scroll = {
      top: document.body.scrollTop,
      left: document.body.scrollLeft
    };
    window.location.hash = "";
    // Restore the scroll offset, should be flicker free
    document.body.scrollTop = scroll.top;
    document.body.scrollLeft = scroll.left;
  }
}

jQuery('#exampleModal').on('show.bs.modal', function (event) {
  var button = jQuery(event.relatedTarget) // Button that triggered the modal
  var recipient = button.data('name') // Extract info from data-* attributes
  // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
  // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
  var modal = jQuery(this)
  modal.find('.modal-title').text('New message to ' + recipient)
  modal.find('.modal-body input').val(recipient)
})

function loadMyFriends() {
  jQuery.getJSON('/api/friends', function(data) {
    var bestList = [];
    var worstList = [];
    var endOfBest = false;
    jQuery.each(data, function(key, friend) {
      var pic = '<img src="' + friend.picture.data.url + '" width="32" height="32">';
      var name = '<a href="' + friend.link + '" target="_blank"><strong>' + friend.name + '</strong></a>';
      var button = '<button type="button" class="btn btn-info pull-right" data-toggle="modal" '
        + 'data-target="#exampleModal" data-id="' + friend.id + '" data-name="' + friend.name + '">'
        + '<span class="glyphicon glyphicon-comment"></span></button><div class="clearfix"></div>';
      var item = '<div class="list-group-item">'
        + pic + ' ' + name + ' ' + button + '</div>';
      // using endOfBest flag since the results are sorted
      if (!endOfBest && friend.rank > 0) {
        bestList.push(item);
      } else {
        endOfBest = true;
        worstList.push(item);
      }
    });
    var olBest = jQuery('<div/>', {
      'class': 'list-group',
      html: bestList.join('')
    });
    var olWorst = jQuery('<div/>', {
      'class': 'list-group',
      html: worstList.join('')
    });
    jQuery('#best-friends-count').text(bestList.length);
    jQuery('#worst-friends-count').text(worstList.length);
    jQuery('#best-friends').empty().append(olBest);
    jQuery('#worst-friends').empty().append(olWorst);
  });
}

function postOnWall(id, message) {
  jQuery.post('/api/friend/' + id + '/post', { "message": message }, function(data) {
    console.log(data)
  });
}
