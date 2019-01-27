$(document).ready(function(){
  //////////
  // Global variables
  //////////

  var _window = $(window);
  var _document = $(document);

  var $headerLogo = $('[js-header-logo]');
  var $headerTop = $('[js-header-top]');
  var $headerBottom = $('[js-header-sticky]');
  var $dropdows = $('.dropdown-menu');

  var aboutSwiper = {
    instance: undefined,
    disableOn: 992
  }

  var gallerySwiper = {
    instance: undefined
  }

  ////////////
  // LIST OF FUNCTIONS
  ////////////

  // some functions should be called once only
  legacySupport();
  positionHeader();
  addMobileMenuClasses();

  // triggered when PJAX DONE
  // The new container has been loaded and injected in the wrapper.
  function pageReady(fromPjax){
    positionDropdownMenus();
    setPageHeaderOffset();
    updateHeaderActiveClass();
    closeMobileMenu();
    setDynamicSizes();
    // revealFooter();
    populateContent();
    positionArticleHeader();
    setStickyElements();
    parseArticleContent();
    checkTabsHash();
    setTabsHeight();

    initMasonry();
    setTimeout(initMasonry, 500)
    initCountDown();
    initSliders(null, fromPjax);
    initPopups();
    initMasks();
    initSelectric();
    initStacktable();
    initScrollMonitor();
    initValidations();

    initLazyLoad();
    // initTeleport();
  }

  // The transition has just finished and the old Container has been removed from the DOM.
  function pageCompleated(fromPjax){
    ieFixImages(fromPjax);
    revealFooter();
  }

  // scroll/resize listeners (some might be found below with isolated initialization)
  _window.on('scroll', positionDropdownMenus);
  _window.on('scroll', positionHeader);
  _window.on('resize', debounce(positionHeader, 200));
  _window.on('resize', debounce(positionDropdownMenus, 200));
  _window.on('resize', debounce(setPageHeaderOffset, 50));
  _window.on('resize', debounce(setDynamicSizes, 100));
  _window.on('resize', throttle(revealFooter, 100));
  _window.on('resize', debounce(resetListenersPrevent, 100))
  _window.on('scroll', throttle(positionArticleHeader, 50));
  _window.on('resize', debounce(setStickyElements, 50));
  _window.on('resize', debounce(positionArticleHeader, 200));
  _window.on('resize', debounce(setTabsHeight, 100));
  _window.on('resize', debounce(initSliders, 200));

  // development helper
  _window.on('resize', debounce(setBreakpoint, 200))


  // this is a master function which should have all functionality
  pageReady();
  pageCompleated();


  // some plugins work best with onload triggers
  _window.on('load', function(){
    // your functions
  })


  //////////
  // COMMON
  //////////

  function legacySupport(){
    // svg support for laggy browsers
    svg4everybody();

    // Viewport units buggyfill
    window.viewportUnitsBuggyfill.init({
      force: false,
      refreshDebounceWait: 150,
      appendToBody: true
    });
  }

  //////////
  // DETECTORS
  //////////
  function isRetinaDisplay() {
    if (window.matchMedia) {
        var mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
        return (mq && mq.matches || (window.devicePixelRatio > 1));
    }
  }

  function isMobile(){
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      return true
    } else {
      return false
    }
  }

  function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
      return true
    } else {
      return false
    }
  }

  if ( msieversion() ){
    $('body').addClass('is-ie');
  }

  if ( isMobile() ){
    $('body').addClass('is-mobile');
  }



  // Prevent # behavior
	_document
    .on('click', '[href="#"]', function(e) {
  		e.preventDefault();
  	})
    .on('click', '[js-link]', function(e){
      var dataHref = $(this).data('href');
      if (dataHref && dataHref !== "#"){
        e.preventDefault();
        e.stopPropagation();
        Barba.Pjax.goTo(dataHref);
      }
    })
    .on('click', 'a[href^="#section"]', function() { // section scroll
      var el = $(this).attr('href');
      $('body, html').animate({
          scrollTop: $(el).offset().top}, 1000);
      return false;
    })


  // HEADER SCROLL
  // add .header-static for .page or body
  // to disable sticky header

  var preventHeaderScrollListener = false

  function positionHeader(){
    if ( window.innerWidth <= 992 ){
      $headerLogo.attr('style', '')
      $headerBottom.attr('style', '')
      $headerTop.find('.header__top').attr('style', '')
      return false
    }

    var vScroll = _window.scrollTop();
    // var $header = $('.header');
    var topHeight = $headerTop.outerHeight() - 10;
    var logoLimits = [1, 0.45] // 357 // [140, 50] // scale factor
    var logoLimitsBottom = [23, 10] // [1, 39.2] // [-23, -9]

    if (preventHeaderScrollListener){
      if ( vScroll <= topHeight ){
        preventHeaderScrollListener = false // re-enable
      } else{
        return // else prevent calculations and setting DOM
      }
    }

    var calcedScroll = vScroll * -1;
    var scrollPercent = 1 - (vScroll / topHeight) // 1 -> 0
    var calcedScale = normalize(vScroll, topHeight, 0, logoLimits[1], logoLimits[0]);
    var calcedBottom = normalize(vScroll, topHeight, 0, logoLimitsBottom[1], logoLimitsBottom[0]);
    var calcedOpacity = scrollPercent

    // limit rules
    if ( vScroll >= topHeight ){
      calcedScroll = topHeight * -1
      calcedScale = logoLimits[1]
      calcedBottom = logoLimitsBottom[1]
      calcedOpacity = 0
      preventHeaderScrollListener = true
    }
    if ( vScroll <= 0 ){
      // calcedScroll = 0
      calcedOpacity = 1
      calcedScale = logoLimits[0]
      calcedBottom = logoLimitsBottom[0]
    }

    // set values to DOM
    $headerLogo.css({
      "transform": 'scale('+ calcedScale +')',
      "bottom": "-" + calcedBottom + "px",
      // translate3d(0,-'+ calcedBottom +'px,0)'
    })

    $headerBottom.css({
      "transform": "translate3d(0," + calcedScroll + "px,0)"
    })

    $headerTop.find('.header__top').css({
      opacity: calcedOpacity
    })
  }

  // Position dropdown menus
  var preventDropdownScrollListener = false

  function positionDropdownMenus(){
    if ( window.innerWidth <= 992 ){
      $dropdows.attr('style', '')
      return false
    }

    var vScroll = _window.scrollTop();
    var topHeight = $headerTop.outerHeight() - 10;
    var bottomHeight = $headerBottom.outerHeight()
    var headerHeight = topHeight + bottomHeight

    if (preventDropdownScrollListener){
      if ( vScroll <= topHeight ){
        preventDropdownScrollListener = false // re-enable
      } else{
        return // else prevent calculations and setting DOM
      }
    }

    var calcedTop = headerHeight - vScroll

    // limit rules
    if ( vScroll >= topHeight ){
      calcedTop = bottomHeight
      preventDropdownScrollListener = true
    }
    if ( vScroll <= 0 ){
      calcedTop = headerHeight
    }

    $dropdows.css({
      'top': calcedTop
    })
  }

  // reset blockers on resize
  function resetListenersPrevent(){
    preventHeaderScrollListener = false
    preventDropdownScrollListener = false
  }

  // HEADER PAGE OFFSET
  function setPageHeaderOffset(){
    var headerHeight =
      ($('[js-header-top]').is(':visible') ? $('[js-header-top]').outerHeight(true) : 20)
      + $('[js-header-sticky]').height();

    $('.page__content').css({
      'padding-top': Math.floor(headerHeight)
    })
  }

  // SET ACTIVE CLASS IN HEADER
  // * could be removed in production and server side rendering when header is inside barba-container
  function updateHeaderActiveClass(){
    $('.header__menu li').each(function(i,val){
      if ( $(val).find('a').attr('href') == window.location.pathname.split('/').pop() ){
        $(val).addClass('is-active');
      } else {
        $(val).removeClass('is-active')
      }
    });
  }

  // HAMBURGER TOGGLER
  var lastScroll = 0;

  function disableScroll() {
    lastScroll = _window.scrollTop();
    $('.page__content').css({
      'margin-top': '-' + lastScroll + 'px'
    });
    $('body').addClass('body-lock');
    $('.footer').addClass('is-hidden')
  }

  function enableScroll() {
    $('.page__content').css({
      'margin-top': '-' + 0 + 'px'
    });
    $('body').removeClass('body-lock');
    $('.footer').removeClass('is-hidden')
    _window.scrollTop(lastScroll)
    lastScroll = 0;
  }

  function blockScroll(unlock) {
    if ($('[js-hamburger]').is('.is-active')) {
      disableScroll();
    } else {
      enableScroll();
    }

    if (unlock) {
      enableScroll();
    }
  };

  _document.on('click', '[js-hamburger]', function(){
    $(this).toggleClass('is-active');
    $('.mobile-navi').toggleClass('is-active');

    blockScroll();
  });

  function closeMobileMenu(){
    $('[js-hamburger]').removeClass('is-active');
    $('.mobile-navi').removeClass('is-active');

    blockScroll();
  }


  // MENU HOVER
  var menuDebounceTime = 300 // how much time user have to hover dropdown menu?
  _document
    .on('mouseenter', '[js-dropdown-menu]', debounce(function(){
      $(this).parent().addClass('is-hovered');
      var target = $(this).data('target');
      $('.dropdown-menu[data-for='+ target +']').addClass('is-active');
    }, menuDebounceTime))
    .on('mouseleave', '[js-dropdown-menu]', debounce(function(){
      $(this).parent().removeClass('is-hovered');
      var target = $(this).data('target');
      $('.dropdown-menu[data-for='+ target +']').removeClass('is-active');
    }, menuDebounceTime))

    // reverse (keep hovered menu active)
    .on('mouseenter', '.dropdown-menu[data-for]', debounce(function(){
      $(this).addClass('is-active');
      var target = $(this).data('for');
      $('[js-dropdown-menu][data-target='+ target +']').parent().addClass('is-hovered');
    }, menuDebounceTime))
    .on('mouseleave', '.dropdown-menu[data-for]', debounce(function(){
      $(this).removeClass('is-active');
      var target = $(this).data('for');
      $('[js-dropdown-menu][data-target='+ target +']').parent().removeClass('is-hovered');
    }, menuDebounceTime))


  // MOBILE NAVI
  function addMobileMenuClasses(){
    var $selector = $('[js-mobile-navi-menu] li');

    if ( $selector.length > 0 ){
      $selector.each(function(i,li){
        if ( $(li).find('ul').length > 0 ){
          $(li).addClass('have-ul');
        }
      })
    }
  }

  // click handlers
  _document
    .on('click', '[js-mobile-navi-menu] li a', throttle(function(e){
      var $this = $(this);
      var $li = $this.parent();
      var haveLi = $li.is('.have-ul');
      if ( haveLi ) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        return
      }
      var $ul = $li.find('ul');
      var $siblings = $li.siblings()

      // clear all first
      $siblings.removeClass('is-opened');
      $siblings.find('ul').slideUp(250);

      // add classes and togglers
      $ul.slideToggle(250);
      $li.toggleClass('is-opened');

    },250, {leading: true}))

    // second level click
    .on('click', '[js-mobile-navi-menu] li ul', function(e){
      e.stopPropagation();
    });

  //////////
  // VARIOUS SIZES FUNCTIONS
  //////////
  function setDynamicSizes(){
    var $articleBG = $('[js-set-article-bg-height]')

    if ( $articleBG.length > 0 ) {
      var parent = $articleBG.parent();
      var image = parent.find('.article__cover')

      var calcedHeight = Math.floor(parent.outerHeight() - (image.outerHeight() / 2))
      $articleBG.css({
        height: calcedHeight
      })

    }

    var $playerImageBG = $('[js-player-image-bg]')

    if ( $playerImageBG.length > 0 ) {
      var wWidth = window.innerWidth;
      var containerWidth = $playerImageBG.closest('.container').width();
      var widnowContainerDiff = (wWidth - containerWidth) / 2

      $playerImageBG.css({
        left: widnowContainerDiff * -1,
        width: widnowContainerDiff + 15 // some overlap just in case
      })
    }

    setPlayerTableWidth()

  }

  function setPlayerTableWidth(){
    var $playerTable = $('[js-set-table-size] table');
    if ( $playerTable.length > 0 ) {

      var $parentTable = $playerTable.parent().closest('table')
      var tableWidth = $parentTable.outerWidth();
      var parentThead = $parentTable.find('.table-player__main-head tr td');
      var parentTheadWidth = []
      parentThead.each(function(i, td){
        parentTheadWidth.push($(td).outerWidth())
      })

      $playerTable.each(function(i, table){
        var $table = $(table);
        var $firstRow = $table.find('tbody tr').first();
        if ( $firstRow.length === 0 ) return

        // find table cells within target firstRow
        var tds = $firstRow.find('td');
        if ( tds.length === 0 ) return

        // var fixedSum = parentTheadWidth[5] + parentTheadWidth[6] + parentTheadWidth[7] + parentTheadWidth[8] + parentTheadWidth[9] + parentTheadWidth[10]
        // var firstMinWidth = $(tds[0]).outerWidth();

        $(tds[0]).css({
          width: '20%'
        })
        // $(tds[1]).css({
        //   'width': tableWidth - (firstMinWidth + fixedSum)
        // })
        $(tds[2]).css({
          'width': parentTheadWidth[5]
        })
        $(tds[3]).css({
          'width': parentTheadWidth[6]
        })
        $(tds[4]).css({
          'width': parentTheadWidth[7]
        })
        $(tds[5]).css({
          'width': parentTheadWidth[8]
        })
        $(tds[6]).css({
          'width': parentTheadWidth[9]
        })
        $(tds[7]).css({
          'width': parentTheadWidth[10]
        })

      })
    }
  }

  ////////////////
  // FOOTER REVEAL
  ////////////////

  function revealFooter() {
    var footer = $('[js-reveal-footer]');
    if (footer.length > 0) {
      var footerHeight = footer.outerHeight();
      var maxHeight = _window.height() - footerHeight > 100;
      if (maxHeight && !msieversion() ) {
        $('body').css({
          'margin-bottom': footerHeight
        });
        footer.css({
          'position': 'fixed',
          'z-index': -10
        });
      } else {
        $('body').css({
          'margin-bottom': 0
        });
        footer.css({
          'position': 'static',
          'z-index': 8
        });
      }
    }
  }



  /***************
  * PAGE SPECIFIC *
  ***************/

  // Article fixed header
  function populateContent(){
    if ( $('[js-populate-content]').length > 0 ){
      $('[js-populate-content]').each(function(i, header){
        var $header = $(header);
        var $title = $($header.data('target'))
        $header.html( $title.text() )
      })
    }
  }

  function positionArticleHeader(){
    var $articleHeader = $('[js-article-fixed-header]');
    if ( !$articleHeader ) return

    // if ( window.innerWidth <= 992 ){
    //   // $articleHeader.attr('style', '')
    //   return false
    // }

    var vScroll = _window.scrollTop();
    var topHeight = $headerTop.outerHeight() - 10;

    if ( vScroll >= topHeight ){
      $articleHeader.addClass('is-visible')
    } else{
      $articleHeader.removeClass('is-visible')
    }
  }

  // parse artcile content
  function parseArticleContent(){
    var $content = $('.article__content');
    if ( $content.length === 0 ) return

    // links with images only
    var $links = $content.find('a');
    if ( $links.length > 0 ){
      $links.each(function(i, a){
        var $link = $(a);
        if ( $link.children().is("img") ){
          $link.addClass('has-image')
        }
      })
    }
  }

  // sticky elements (outside container)
  function setStickyElements(){
    var $sticky = $('[js-sticky-outside-container]');
    if ( $sticky.length === 0 ) return

    var wWidth = window.innerWidth;
    $sticky.each(function(i, st){
      var $st = $(st);
      var direction = $st.data('position');
      var $container = $st.closest('.container');
      var containerWidth = $container.width()

      var offset = 0
      // NOTE - works with aligned elements to very end of container (ml: auto, mr: auto)
      if ( direction === "right" ){
        offset = (wWidth - containerWidth) / 2
      } else if ( direction === "left" ){
        offset = ((wWidth - containerWidth) / 2 ) * -1
      }

      $st.css({
        'transform': 'translate3d('+offset+'px,0,0)'
      })
    })
  }

  // TABS
  _document
    .on('click', '[js-tabs] a', function(){
      var dataTarget = $(this).data('target');
      changeTab(dataTarget)
      window.location.hash = dataTarget
    })

  // hashnav chechker
  function checkTabsHash(){
    var hash = window.location.hash.substring(1)
    if ( hash ) changeTab(hash)
  }

  function changeTab(target){
    var $this = $('[js-tabs] a[data-target="'+target+'"]')
    if ( !$this ) return

    var $target = $('[data-tab-for="'+target+'"]')
    var $tabsTitle = $this.closest('.container').find('[js-tab-title]')

    // tab toggle
    $this.parent().siblings().find('a').removeClass('is-active');
    $this.addClass('is-active')
    // $target.siblings().slideUp();
    // $target.slideDown();
    $target.siblings().removeClass('is-active')
    $target.addClass('is-active');

    setTabsHeight();

    // change title
    if ( $tabsTitle.length > 0 ){
      $tabsTitle.html($this.text())
    }
  }

  function setTabsHeight(){
    var $target = $('.tab.is-active');
    var targetHeight = $target.outerHeight()
    $target.closest('.tabs-wrapper').css({'height': targetHeight})
  }

  // player page
  _document
    .on('click', '[js-open-player-row]', function(){
      var $row = $(this).closest('tr').next();

      if ( !$row.is('.table-player__collapsable') ) return
      $row.toggle();
      setPlayerTableWidth();
      $(this).toggleClass('is-active')
    })


  // article more section and generic toggler
  _document
    .on('click', '[js-slideToggle]', function(){
      var $btn = $(this);
      var dataTarget = $btn.data("for");
      var $target = $('[data-target="'+dataTarget+'"]');

      if ( $target.length === 0 ) return
      $target.slideToggle();

    })

  /**********
  * PLUGINS *
  **********/


  //////////
  // MASONRY
  //////////
  function initMasonry(shouldReload){
    if ( $('[js-masonry]').length > 0 ){
      $('[js-masonry]').each(function(i, masonry){
        var $masonry = $(masonry);
        var $grid;
        var masonryOption = {
          // layoutMode: 'masonry',
          layoutMode: 'packery',
          itemSelector: '[js-masonry-card]',
          percentPosition: true,
          // gutter: 36,
          // masonry: {
          //   columnWidth: '[js-masonry-grid-sizer]'
          // },
          packery: {
            // https://packery.metafizzy.co/options.html
            columnWidth: '[js-masonry-grid-sizer]',
            originLeft: true,
            originTop: true,
            gutter: 0
          }
        }
        $grid = $masonry.isotope(masonryOption);

        // if ( window.innerWidth < 640 ){
        //   $grid.masonry('destroy')
        // } else {
        //   $grid.masonry(masonryOption);
        //   if ( shouldReload ){
        //     setTimeout(function(){
        //       $grid.masonry('reloadItems')
        //     }, 150)
        //   }
        // }

        // var $masonry = $(masonry);
        // var $grid;
        // var masonryOption = {
        //   itemSelector: '[js-masonry-card]',
        //   columnWidth: '[js-masonry-grid-sizer]',
        //   percentPosition: true,
        //   gutter: 36
        // }
        // $grid = $masonry.masonry(masonryOption);
        //
        // if ( window.innerWidth < 640 ){
        //   $grid.masonry('destroy')
        // } else {
        //   $grid.masonry(masonryOption);
        //   if ( shouldReload ){
        //     setTimeout(function(){
        //       $grid.masonry('reloadItems')
        //     }, 150)
        //   }
        // }
      })
    }
  }

  // masonry click handlers
  _document
    .on('click', '[js-masonry-filter] a', function(){
      var $this = $(this);
      var gridTarget = $this.closest('[js-masonry-filter]').data('target');
      var $masonryGrid = $('[js-masonry][data-for="'+gridTarget+'"]');
      var dataFilter = $this.data('filter');

      $masonryGrid.isotope({
        filter: function() {
          if ( !dataFilter ) return true // if filter is blank - show all

          var cardFilters = $(this).data('filter').split(" ")
          return cardFilters.indexOf(dataFilter) !== -1
        }
      });

      $this.parent().siblings().find('a').removeClass('is-active');
      $this.addClass('is-active');
    })

  function initCountDown(){
    if ($("[js-countdown]").length > 0) {
      var $this    = $('[js-countdown]');
      var endDate  = new Date($this.data('timestamp')).getTime();
      var $days    = $this.find('[js-days]')
      var $hours   = $this.find('[js-hours]')
      var $minutes = $this.find('[js-minutes]')
      var $seconds = $this.find('[js-seconds]')

      // Update the count down every 1 second
      var x = setInterval(function() {
        // Get todays date and time
        var now = new Date().getTime();

        // Find the distance between now an the count down date
        var distance = endDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // If the count down is finished, write some text
        if (distance < 0) {
          clearInterval(x);
          $this.css({'opacity': .5});
          return
          // document.getElementById("#days").innerHTML = "EXPIRED";
        }

        // Display the result in the element with id="demo"
        $days.find('.counter__number').html((days).pad(2));
        $days.find('.counter__name').html( pluralize('day', days) );
        $hours.find('.counter__number').html((hours).pad(2));
        $hours.find('.counter__name').html( pluralize('hour', hours) );
        $minutes.find('.counter__number').html((hours).pad(2));
        $minutes.find('.counter__name').html( pluralize('min', minutes) );
        $seconds.find('.counter__number').html((seconds).pad(2));
        $seconds.find('.counter__name').html( pluralize('sec', minutes) );

      }, 1000);

    }
  }


  //////////
  // SLIDERS
  //////////
  function initSliders(e, fromPjax){
    // clean up on page changes
    if ( fromPjax && (aboutSwiper.instance !== undefined)){
      aboutSwiper.instance.destroy( true, true );
      aboutSwiper.instance = undefined
    }

    // INIT CHECKERS
    // console.log('swiper debug', fromPjax, aboutSwiper.instance, $('[js-about-swiper]'))

    if ( $('[js-about-swiper]').length > 0 ){
      if ( window.innerWidth >= aboutSwiper.disableOn ) {
        if ( aboutSwiper.instance !== undefined ) {
          aboutSwiper.instance.destroy( true, true );
          aboutSwiper.instance = undefined
        }
        // return
      } else {
        if ( aboutSwiper.instance === undefined ) {
          enableAboutSwiper();
        }
      }
    }

    if ($('[js-gallery-swiper]').length > 0 ) {
      enableGallerySwiper()
    }

    if ( $('[js-article-cover-swiper]').length > 0 ){
      enableArticleCoverSwiper();
    }

    if ( $('[js-hero-swiper]').length > 0 ){
      enableHeroSwiper();
    }
  }

  // ABOUT SWIPER
  var aboutSwiperTransitioning = false

  function enableAboutSwiper(){
    aboutSwiper.instance = new Swiper('[js-about-swiper]', {
      wrapperClass: "swiper-wrapper",
      slideClass: "about__slider-slide",
      direction: 'horizontal',
      loop: false,
      watchOverflow: false,
      setWrapperSize: false,
      // spaceBetween: 36,
      slidesPerView: 'auto',
      normalizeSlideIndex: true,
      freeMode: true,
      freeModeSticky: false,
      freeModeMinimumVelocity: 0.05,
      freeModeMomentumRatio: 1.2,
      preventClicks: true,
      breakpoints: {
        // when window width is <= 992px
        992: {
          spaceBetween: 36,
        },
        576: {
          spaceBetween: 10,
        }
      },
      on: {
        slideChange: function(){
        },
        transitionStart: function(){
          aboutSwiperTransitioning = true
        },
        transitionEnd: function(){
          aboutSwiperTransitioning = false

          // var slides = aboutSwiper.instance.slides
          // var swiperWidth = aboutSwiper.instance.width + 30
          // var translate = aboutSwiper.instance.translate
          //
          // $.each(slides, function(slide){
          //   var $slide = $(slides[slide]);
          //   var offsetLeft = $slide.position().left // position inside container
          //   var slideWidth = $slide.width()
          //   var actualPosition = offsetLeft - (translate * -1)
          //
          //   // console.log(
          //   //   $slide,
          //   //   'offsetLeft - ' + offsetLeft,
          //   //   'actualPosition - ' + actualPosition,
          //   //   'translate - ' + translate)
          //
          //   $slide.removeClass('swiper-slide-outside')
          //
          //   console.log(actualPosition, (0 + (slideWidth / 2)))
          //   // fade sides that are halfly outside container
          //   if (
          //     (actualPosition > (swiperWidth + (slideWidth / 2))) // outside right
          //     || (actualPosition < (0 - (slideWidth / 2))) ) // outsude left
          //     {
          //     $slide.addClass('swiper-slide-outside')
          //   }
          // })

        }
      }
    })
  }

  _document
    .on('click', '.about-card', function(e){
      e.preventDefault();
      e.stopPropagation();
    })

    .on('click', '.about-card', debounce(function(e){
      if ( !aboutSwiperTransitioning ){
        var newHref = $(this).attr('href')
        if ( isOutLink(newHref) ){
          window.open(newHref)
        } else {
          Barba.Pjax.goTo(newHref);
        }
      }
    }, 300, {leading: false}))

  function isOutLink(href){
    return href.indexOf(window.location.hostname) === -1
  }


  function enableGallerySwiper(){
    gallerySwiper.instance = new Swiper('[js-gallery-swiper]', {
      init: false,
      wrapperClass: "swiper-wrapper",
      slideClass: "gallery__slide",
      direction: 'horizontal',
      loop: true,
      watchOverflow: false,
      setWrapperSize: false,
      // spaceBetween: 36,
      slidesPerView: 1,
      normalizeSlideIndex: true,
      // custom pagination
      // pagination: {
      //   el: '.gallery__nav-pagination',
      //   type: 'fraction',
      //   renderFraction: function (currentClass, totalClass) {
      //     return '<span class="' + currentClass + '"></span>' +
      //            ' / ' +
      //            '<span class="' + totalClass + '"></span>';
      //   }
      // },
      // custom click handlers
      // navigation: {
      //   nextEl: '.gallery__btn gallery__btn--next',
      //   prevEl: '.gallery__btn gallery__btn--prev',
      // },
    })
    gallerySwiper.instance.on('init', function() {
      changeNav()
    });
    gallerySwiper.instance.on('slideChange', function() {
      changeNav()
    });

    function changeNav(){
      var totalSlides = gallerySwiper.instance.slides.length - 2
      var curSlide = gallerySwiper.instance.realIndex + 1
      $('[js-swiper-fraction]').find('span').text(curSlide + '/' + totalSlides)

      var activeSlide = gallerySwiper.instance.slides[curSlide]
      var slideTitle = $(activeSlide).data('title')
      $('[js-swiper-title]').html(slideTitle)
    }

    gallerySwiper.instance.init();
  }

  _document
    .on('click', '[js-swiper-nav]', function(){
      var dataType = $(this).data('type');

      if ( dataType === "prev" ){
        gallerySwiper.instance.slidePrev()
      } else if ( dataType === "next" ){
        gallerySwiper.instance.slideNext()
      }

    })


  function enableArticleCoverSwiper(){
    new Swiper('[js-article-cover-swiper]', {
      wrapperClass: "swiper-wrapper",
      slideClass: "swiper-slide",
      direction: 'horizontal',
      loop: true,
      watchOverflow: true,
      setWrapperSize: false,
      slidesPerView: 1,
      normalizeSlideIndex: true,
      autoplay: {
        delay: 5000,
      },
      // custom pagination
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true
      }
    })
  }


  function enableHeroSwiper(){
    new Swiper('[js-hero-swiper]', {
      wrapperClass: "swiper-wrapper",
      slideClass: "swiper-slide",
      direction: 'horizontal',
      loop: true,
      watchOverflow: true,
      setWrapperSize: false,
      slidesPerView: 1,
      normalizeSlideIndex: true,
      autoplay: {
        delay: 5000,
      },
      // custom pagination
      navigation: {
        nextEl: '.gallery__btn.gallery__btn--next',
        prevEl: '.gallery__btn.gallery__btn--prev',
      },
    })
  }





  //////////
  // MODALS
  //////////

  function initPopups(){
    // Magnific Popup
    var startWindowScroll = 0;
    $('[js-popup]').magnificPopup({
      type: 'inline',
      fixedContentPos: true,
      fixedBgPos: true,
      overflowY: 'auto',
      closeBtnInside: true,
      preloader: false,
      midClick: true,
      removalDelay: 300,
      mainClass: 'popup-buble',
      callbacks: {
        beforeOpen: function() {
          startWindowScroll = _window.scrollTop();
          // $('html').addClass('mfp-helper');
        },
        close: function() {
          // $('html').removeClass('mfp-helper');
          _window.scrollTop(startWindowScroll);
        }
      }
    });

    $('[js-popup-gallery]').magnificPopup({
  		delegate: 'a',
  		type: 'image',
  		tLoading: 'Загрузка #%curr%...',
  		mainClass: 'popup-buble',
  		gallery: {
  			enabled: true,
  			navigateByImgClick: true,
  			preload: [0,1]
  		},
  		image: {
  			tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
  		}
  	});
  }

  function closeMfp(){
    $.magnificPopup.close();
  }

  ////////////
  // UI
  ////////////

  // textarea autoExpand
  _document
    .one('focus.autoExpand', '.ui-group textarea', function(){
        var savedValue = this.value;
        this.value = '';
        this.baseScrollHeight = this.scrollHeight;
        this.value = savedValue;
    })
    .on('input.autoExpand', '.ui-group textarea', function(){
        var minRows = this.getAttribute('data-min-rows')|0, rows;
        this.rows = minRows;
        rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 17);
        this.rows = minRows + rows;
    });

  // Masked input
  function initMasks(){
    $("[js-dateMask]").mask("99.99.99",{placeholder:"ДД.ММ.ГГ"});
    $("input[type='tel']").mask("+7 (000) 000-0000", {placeholder: "+7 (___) ___-____"});
  }

  // selectric
  function initSelectric(){
    $('select').selectric({
      maxHeight: 300,
      arrowButtonMarkup: '<b class="button"><svg class="ico ico-select-down"><use xlink:href="img/sprite.svg#ico-select-down"></use></svg></b>',

      onInit: function(element, data){
        var $elm = $(element),
            $wrapper = $elm.closest('.' + data.classes.wrapper);

        $wrapper.find('.label').html($elm.attr('placeholder'));
      },
      onBeforeOpen: function(element, data){
        var $elm = $(element),
            $wrapper = $elm.closest('.' + data.classes.wrapper);

        $wrapper.find('.label').data('value', $wrapper.find('.label').html()).html($elm.attr('placeholder'));
      },
      onBeforeClose: function(element, data){
        var $elm = $(element),
            $wrapper = $elm.closest('.' + data.classes.wrapper);

        $wrapper.find('.label').html($wrapper.find('.label').data('value'));
      }
    });

    $('[js-select-fxiture-date]').on('selectric-select', function(event, element, selectric){
      // console.log(event, element, selectric)
      var curValue = $(element).val()
      console.log('select change', curValue)

      // i.e. redirect to page
      // window.location.href = '/fixtures' + curValue
      // Barba.Pjax.goTo('/fixtures' + curValue); // or with pjax
    })
  }

  // Stacktable
  function initStacktable(){
    if ( $('[js-stacktable]').length > 0 ){
      $('[js-stacktable]').each(function(i, el){
        var $el = $(el);
        $el.stacktable();

        $('.stacktable.small-only').find('.table-results__link').parent().addClass('is-last')
      })
    }
  }

  ////////////
  // SCROLLMONITOR - WOW LIKE
  ////////////
  function initScrollMonitor(){
    $('.wow').each(function(i, el){

      var elWatcher = scrollMonitor.create( $(el) );

      var delay;
      if ( $(window).width() < 768 ){
        delay = 0
      } else {
        delay = $(el).data('animation-delay');
      }

      var animationClass = $(el).data('animation-class') || "wowFadeUp"

      var animationName = $(el).data('animation-name') || "wowFade"

      elWatcher.enterViewport(throttle(function() {
        $(el).addClass(animationClass);
        $(el).css({
          'animation-name': animationName,
          'animation-delay': delay,
          'visibility': 'visible'
        });
      }, 100, {
        'leading': true
      }));
      // elWatcher.exitViewport(throttle(function() {
      //   $(el).removeClass(animationClass);
      //   $(el).css({
      //     'animation-name': 'none',
      //     'animation-delay': 0,
      //     'visibility': 'hidden'
      //   });
      // }, 100));
    });

  }

  ////////////////
  // FORM VALIDATIONS
  ////////////////

  // jQuery validate plugin
  // https://jqueryvalidation.org
  function initValidations(){
    // GENERIC FUNCTIONS
    var validateErrorPlacement = function(error, element) {
      error.addClass('ui-input__validation');
      error.appendTo(element.parent("div"));
    }
    var validateHighlight = function(element) {
      $(element).addClass("has-error");
    }
    var validateUnhighlight = function(element) {
      $(element).removeClass("has-error");
    }
    var validateSubmitHandler = function(form) {
      $(form).addClass('loading');
      $.ajax({
        type: "POST",
        url: $(form).attr('action'),
        data: $(form).serialize(),
        success: function(response) {
          $(form).removeClass('loading');
          var data = $.parseJSON(response);
          if (data.status == 'success') {
            // do something I can't test
          } else {
              $(form).find('[data-error]').html(data.message).show();
          }
        }
      });
    }

    var validatePhone = {
      required: true,
      normalizer: function(value) {
          var PHONE_MASK = '+X (XXX) XXX-XXXX';
          if (!value || value === PHONE_MASK) {
              return value;
          } else {
              return value.replace(/[^\d]/g, '');
          }
      },
      minlength: 11,
      digits: true
    }

    /////////////////////
    // REGISTRATION FORM
    ////////////////////
    $(".js-registration-form").validate({
      errorPlacement: validateErrorPlacement,
      highlight: validateHighlight,
      unhighlight: validateUnhighlight,
      submitHandler: validateSubmitHandler,
      rules: {
        last_name: "required",
        first_name: "required",
        email: {
          required: true,
          email: true
        },
        password: {
          required: true,
          minlength: 6,
        }
        // phone: validatePhone
      },
      messages: {
        last_name: "Заполните это поле",
        first_name: "Заполните это поле",
        email: {
            required: "Заполните это поле",
            email: "Email содержит неправильный формат"
        },
        password: {
            required: "Заполните это поле",
            email: "Пароль мимимум 6 символов"
        },
        // phone: {
        //     required: "Заполните это поле",
        //     minlength: "Введите корректный телефон"
        // }
      }
    });

    var subscriptionValidationObject = {
      errorPlacement: validateErrorPlacement,
      highlight: validateHighlight,
      unhighlight: validateUnhighlight,
      submitHandler: validateSubmitHandler,
      rules: {
        email: {
          required: true,
          email: true
        }
      },
      messages: {
        email: {
          required: "Fill this field",
          email: "Email is invalid"
        }
      }
    }

    // call/init
    $("[js-subscription-validation]").validate(subscriptionValidationObject);
    $("[js-subscription-validation-footer]").validate(subscriptionValidationObject);
    $("[js-subscription-validation-menu]").validate(subscriptionValidationObject);
    $("[js-subscription-validation-mailer]").validate(subscriptionValidationObject);
  }

  //////////
  // LAZY LOAD
  //////////
  function initLazyLoad(){
    $('[js-lazy]').Lazy({
      threshold: 500,
      enableThrottle: true,
      throttle: 100,
      scrollDirection: 'vertical',
      effect: 'fadeIn',
      effectTime: 350,
      // visibleOnly: true,
      // placeholder: "data:image/gif;base64,R0lGODlhEALAPQAPzl5uLr9Nrl8e7...",
      onError: function(element) {
          console.log('error loading ', element);
      },
      beforeLoad: function(element){
        // element.attr('style', '')
      },
      afterLoad: function(element){
        setDynamicSizes()
      }
    });

    $('[js-lazy]').Lazy({
      onFinishedAll: function() {
        ieFixImages()
        if( !this.config("autoDestroy") )
            setDynamicSizes();
      }
    });

  }

  ////////////////////////////////
  // fix ie images with object fit
  ////////////////////////////////
  function ieFixImages(fromPjax){
    if ( !msieversion() ) return
    if ( fromPjax ) window.fitie.init()
  }


  //////////
  // BARBA PJAX
  //////////
  var easingSwing = [.02, .01, .47, 1]; // default jQuery easing for anime.js

  Barba.Pjax.Dom.containerClass = "page";

  var FadeTransition = Barba.BaseTransition.extend({
    start: function() {
      Promise
        .all([this.newContainerLoading, this.fadeOut()])
        .then(this.fadeIn.bind(this));
    },

    fadeOut: function() {
      var deferred = Barba.Utils.deferred();

      anime({
        targets: this.oldContainer,
        opacity : .5,
        easing: easingSwing, // swing
        duration: 300,
        complete: function(anim){
          deferred.resolve();
        }
      })

      return deferred.promise
    },

    fadeIn: function() {
      var _this = this;
      var $el = $(this.newContainer);

      $(this.oldContainer).hide();

      $el.css({
        visibility : 'visible',
        opacity : .5
      });

      anime({
        targets: "html, body",
        scrollTop: 1,
        easing: easingSwing, // swing
        duration: 150
      });

      anime({
        targets: this.newContainer,
        opacity: 1,
        easing: easingSwing, // swing
        duration: 300,
        complete: function(anim) {
          triggerBody()
          _this.done();
        }
      });
    }
  });

  // set barba transition
  Barba.Pjax.getTransition = function() {
    return FadeTransition;
  };

  Barba.Prefetch.init();
  Barba.Pjax.start();

  // The new container has been loaded and injected in the wrapper.
  Barba.Dispatcher.on('newPageReady', function(currentStatus, oldStatus, container, newPageRawHTML) {
    pageReady(true);
  });

  // The transition has just finished and the old Container has been removed from the DOM.
  Barba.Dispatcher.on('transitionCompleted', function(currentStatus, oldStatus) {
    pageCompleated(true);
  });


  // some plugins get bindings onNewPage only that way
  function triggerBody(){
    _window.scrollTop(0);
    $(window).scroll();
    $(window).resize();
  }

  //////////
  // MEDIA Condition helper function
  //////////
  function mediaCondition(cond){
    var disabledBp;
    var conditionMedia = cond.substring(1);
    var conditionPosition = cond.substring(0, 1);

    if (conditionPosition === "<") {
      disabledBp = window.innerWidth < conditionMedia;
    } else if (conditionPosition === ">") {
      disabledBp = window.innerWidth > conditionMedia;
    }

    return disabledBp
  }

  //////////
  // DEVELOPMENT HELPER
  //////////
  function setBreakpoint(){
    var wHost = window.location.host.toLowerCase()
    var displayCondition = wHost.indexOf("localhost") >= 0 || wHost.indexOf("surge") >= 0
    if (displayCondition){
      var wWidth = window.innerWidth;

      var content = "<div class='dev-bp-debug'>"+wWidth+"</div>";

      $('.page').append(content);
      setTimeout(function(){
        $('.dev-bp-debug').fadeOut();
      },1000);
      setTimeout(function(){
        $('.dev-bp-debug').remove();
      },1500)
    }
  }

});


// HELPER FUNCTIONS AND MATH
function normalize(value, fromMin, fromMax, toMin, toMax) {
  var pct = (value - fromMin) / (fromMax - fromMin);
  var normalized = pct * (toMax - toMin) + toMin;

  //Cap output to min/max
  if (normalized > toMax) return toMax;
  if (normalized < toMin) return toMin;
  return normalized;
}

Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}
