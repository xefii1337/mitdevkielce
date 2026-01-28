import { supabase } from './supabase-client.js';
import '../css/mit-dev.css';
import '../css/mit-dev-sidebar.css';

(async function trackPageView() {
  try {
    // Increment page view count for 'home'
    // We use a stored procedure or just update. Since we have RLS allowing update, we can do this.
    // However, standard update requires fetching first or using an RPC.
    // For simplicity in this demo, we'll fetch then update. 
    // Note: In high traffic, this is not atomic. Better to use RPC `increment_page_view`.

    const { data, error } = await supabase
      .from('page_views')
      .select('count')
      .eq('page', 'home')
      .single();

    if (data) {
      await supabase
        .from('page_views')
        .update({ count: data.count + 1 })
        .eq('page', 'home');
    }
  } catch (err) {
    console.error('Analytics error:', err);
  }
})();


(function ($) {

  "use strict";

  // MENU
  $('#sidebarMenu .nav-link').on('click', function () {
    $("#sidebarMenu").collapse('hide');
  });

  // DESKTOP SIDEBAR TOGGLE
  $('#desktopSidebarToggle').on('click', function () {
    $('body').toggleClass('sidebar-collapsed');
  });

  // CUSTOM LINK
  $('.smoothscroll').click(function () {
    var el = $(this).attr('href');
    var elWrapped = $(el);
    var header_height = $('.navbar').height();

    scrollToDiv(elWrapped, header_height);
    return false;

    function scrollToDiv(element, navheight) {
      var offset = element.offset();
      var offsetTop = offset.top;
      var totalScroll = offsetTop - navheight;

      $('body,html').animate({
        scrollTop: totalScroll
      }, 300);
    }
  });

})(window.jQuery);


