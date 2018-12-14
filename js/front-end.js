//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

$(function() {
  var win = $(window);

  // allow HTML5 tags used by Silex to be styled with CSS (polyfill)
  document.createElement('HEADER');
  document.createElement('VIDEO');

  // store the body selector
  // be careful since it will change after undo/redo or open file in Silex editor
  var bodyEl = $('body');

   /**
   * returns a function that will not be called more than every `wait` seconds
   */
  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        clearTimeout(timeout);
        timeout = null;
        func.apply(context, args);
      };
      if(!timeout) timeout = setTimeout(later, wait);
    };
  };

  /**
   * window resize event
   */
  var siteWidth = $('meta[name=website-width]').attr('content');
  var resizeBody = debounce(function (event){
    var bodyEl = $('body');
    // behavior which is not the same in Silex editor and outside the editor
    if(bodyEl.hasClass('silex-runtime')) {
      // if the site has a defined width and the window is smaller than this width, then
      // scale the website to fit the window
      if(siteWidth) {
        var winWidth = win.width();
        if(winWidth > 480 && winWidth < siteWidth) {
            $('body').css({
              'transform': 'scale(' + (winWidth / 1200) + ')',
              'transform-origin': '0 0',
            })
        }
        else {
            $('body').css({
              'transform': '',
              'transform-origin': '',
            })
        }
      }
    }
    else {
      // add space around the elements in the body
      // I removed this because it bugs when there are elements with 100% width
      //width += 50;
      //height += 50;
    }
    // dispatch an event so that components can update
    $(document).trigger('silex:resize');
  }, 500);

  // only outside silex editor when the window is small enough
  // change viewport to enable mobile view scale mode
  // for "pixel perfect" mobile version
  // bellow 960, the window width will be seen as 480
  if(bodyEl.hasClass('silex-runtime')) {
    var winWidth = win.width();
    if(winWidth < 960) {
      $('meta[data-silex-viewport]').attr('content', 'width=479, user-scalable=no, maximum-scale=1');
    }
  }

 /**
   * list all pages from the head section
   * and open the 1st one by default
   */
  var firstPageName = null;
  var pages = $('a[data-silex-type="page"]');
  if (pages && pages.length>0){
    var firstPage = pages[0];
    firstPageName = firstPage.getAttribute('id');
  }
  /**
   * callback for change events
   * called when a page is opened
   */
  bodyEl.on('pageChanged', function (event, pageName) {
    // mark links to the current page as active
    $('[data-silex-href*="#!'+pageName+'"]').addClass('page-link-active');
    $('[id*="'+pageName+'"]').addClass('page-link-active');
    // prevent iframe content from staying in the dom
    // this prevent a youtube video to continue playing while on another page
    // this is useful in chrome and not firefox since display:none does not reset iframe dom in chrome
    $('[data-silex-iframe-src]').each(function() {
      this.setAttribute('src', this.getAttribute('data-silex-iframe-src'));
    });
    $('.paged-element-hidden iframe').each(function() {
      var src = this.getAttribute('src');
      if(src) {
        this.setAttribute('data-silex-iframe-src', src);
        this.setAttribute('src', '');
      }
    });
    // resize on page change (size will vary)
    resizeBody();
  });
  /**
   * init page system
   * Use deep links (hash) only when `body.silex-runtime` is defined, i.e. not while editing
   */
  bodyEl.pageable({
    currentPage: firstPageName,
    useDeeplink: bodyEl.hasClass('silex-runtime'),
    pageClass: 'paged-element'
  });
  /**
   * Silex links
   * Only when `body.silex-runtime` is defined, i.e. not while editing
   * Links are not clickable while editing
   */
  $('.silex-runtime [data-silex-href]').click(function () {
    var href = this.getAttribute('data-silex-href');
    if (href.indexOf('#') === 0){
      window.location.href = href;
    }
    else {
      window.open(href, '_blank');
    }
  });
  /**
   * mobile menu
   */
  $('.silex-runtime .silex-pages .menu-button').click(function () {
    $(document.body).toggleClass('show-mobile-menu');
  });
  $('.silex-runtime .silex-pages .page-element').click(function(e) {
    window.location.hash = '#!' + this.id;
    $(document.body).removeClass('show-mobile-menu');
    e.preventDefault();
  });

  // resize body at start
  resizeBody();

  // resize body on window resize
  win.resize(resizeBody);

  // expose for use by the widgets and Silex editor
  window.resizeBody = resizeBody;
});
