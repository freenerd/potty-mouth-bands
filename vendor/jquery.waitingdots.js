// Adds dots ... while the element has the waiting class
jQuery.fn.waitingDots = function(waitingClass, maxDots, onComplete) {

	var e = $(this);
	var term = e.val() || e.text();
	e.addClass(waitingClass);

	var count = 0;
	var numDots = maxDots || 3;

	var interval = setInterval(function() {
		if (!e.hasClass(waitingClass)) {
			clearInterval(interval);
			onComplete.apply(e);
		}
		else {
			var newText = term;
      for (i=0;i<=count;i++) newText += " .";
			e.val(newText).text(newText); // Update text
			count < numDots ? count++ : count = 0;  // Update counter
		}
	}, 400);

};
