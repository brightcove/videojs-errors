(function(){
  var
    defaults = {
      locale: document.getElementsByTagName('html')[0].getAttribute('lang') || navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language || 'en-US',
      header: '',
      code: '',
      message: '',
      timeout: 45 * 1000,
      localizations: {
        es: {
          'error code': 'Código de error',
          'technical details': 'Details de technicali',
          1: {
            headline: 'La descarga de vídeo fue cancelada'
          },
          2: {
            headline: 'La conexión de vídeo se perdió, por favor confirme que está conectado a Internet'
          },
          3: {
            headline: 'El video es malo o en un formato que no se puede jugar en su navegador'
          },
          4: {
            headline: 'Este video no está disponible o no está soportado en este navegador'
          },
          5: {
            headline: 'El vídeo que estás tratando de ver es encriptada y no sabemos cómo descifrarlo'
          },
          unknown: {
            headline: 'Se ha encontrado un problema inesperado, vuelva otro día y vuelve a intentarlo'
          },
          '-1': {
            headline: 'Ningún vídeo se ha cargado'
          },
          '-2': {
            headline: 'No se pudo descargar el video'
          }
        }
      },
      errors: {
        1: {
          type: 'MEDIA_ERR_ABORTED',
          headline: 'The video download was cancelled'
        },
        2: {
          type: 'MEDIA_ERR_NETWORK',
          headline: 'The video connection was lost, please confirm you\'re connected to the internet'
        },
        3: {
          type: 'MEDIA_ERR_DECODE',
          headline: 'The video is bad or in a format that can\'t be played on your browser'
        },
        4: {
          type: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
          headline: 'This video is either unavailable or not supported in this browser'
        },
        5: {
          type: 'MEDIA_ERR_ENCRYPTED',
          headline: 'The video you\'re trying to watch is encrypted and we don\'t know how to decrypt it'
        },
        unknown: {
          type: 'MEDIA_ERR_UNKNOWN',
          headline: 'An unanticipated problem was encountered, check back soon and try again'
        },
        '-1': {
          type: 'PLAYER_ERR_NO_SRC',
          headline: 'No video has been loaded'
        },
        '-2': {
          type: 'PLAYER_ERR_TIMEOUT',
          headline: 'Could not download the video'
        }
      }
    },
    /**
     * Monitors a player for signs of life during playback and
     * triggers PLAYER_ERR_TIMEOUT if none occur within a reasonable
     * timeframe.
     */
    monitorPlayback = function(player, options) {
      var
        settings = videojs.util.mergeOptions(defaults, options),

        monitor,
        // clears the previous monitor timeout and sets up a new one
        resetMonitor = function() {
          window.clearTimeout(monitor);
          monitor = window.setTimeout(function() {
            if (player.error()) {
              // never overwrite existing errors
              return;
            }

            player.error({
              code: -2,
              type: 'PLAYER_ERR_TIMEOUT'
            });
          }, settings.timeout);

          // clear out any existing player timeout
          if (player.error() && player.error().code === -2) {
            player.error(null);
          }
        },

        listeners = [],
        // creates and tracks a player listener if the player looks alive
        healthcheck = function(type, fn) {
          var check = function() {
            // playback isn't expected if the player is paused, shut
            // down monitoring
            if (player.paused()) {
              return cleanup();
            }
            // playback isn't expected once the video has ended
            if (player.ended()) {
              return cleanup();
            }
            fn.call(this);
          };
          player.on(type, check);
          listeners.push([type, check]);
        },
        // clear any previously registered listeners
        cleanup = function() {
          var listener;
          while (listeners.length) {
            listener = listeners.shift();
            player.off(listener[0], listener[1]);
          }
          window.clearTimeout(monitor);
        };

      player.on('play', function() {
        var lastTime = 0;

        cleanup();

        // if no playback is detected for long enough, trigger a timeout error
        resetMonitor();
        healthcheck('timeupdate', function() {
          var currentTime = player.currentTime();
          if (currentTime !== lastTime) {
            lastTime = currentTime;
            resetMonitor();
          }
        });
        healthcheck('progress', resetMonitor);
      });
    },
    // shim in IE8 event listener support
    on = function(elem, type, fn) {
      if (elem.addEventListener) {
        elem.addEventListener(type, fn, false);
      } else {
        elem.attachEvent('on' + type, fn);
      }
    };

  // Setup Custom Error Conditions
  var initCustomErrorConditions = function(player, options) {
    var stalledTimeout, playbackMonitor;

    // PLAYER_ERR_TIMEOUT
    monitorPlayback(player, options);

    // PLAYER_ERR_NO_SRC
    player.on('play', function() {
      if (player.currentSrc() === null ||
          player.currentSrc() === undefined ||
          player.currentSrc() === '') {
        player.error({
          code: -1,
          type: 'PLAYER_ERR_NO_SRC'
        });
      }
    });
  };

  videojs.plugin('errors', function(options){

    var
      player = this,
      // Merge the external and default settings
      settings = videojs.util.mergeOptions(defaults, options);

    // Add to the error dialog when an error occurs
    this.on('error', function() {
      var code, error, display, details = '';

      error = videojs.util.mergeOptions(this.error(), settings.errors[this.error().code || 0]);

      if (error.message) {
        details = '<div class="vjs-errors-details"><span data-i18n="Technical details" class="vjs-tech-details">: </span>' +
          '<div data-i18n="' + error.message + '" class="vjs-errors-message"></div>' +
          '</div>';
      }

      display = this.errorDisplay;
      display.el().innerHTML =
        '<div class="vjs-errors-dialog">' +
          '<button class="vjs-errors-close-button"></button>' +
          '<div class="vjs-errors-content-container">' +
            '<h2 data-i18n="'+error.headline+'" class="vjs-errors-headline"></h2>' +
            '<div><b class="vjs-error-code" data-i18n="Error Code">: </b><span data-i18n="' + (error.type || error.code) + '"></span></div>' +
            details +
          '</div>' +
          '<div class="vjs-errors-ok-button-container">' +
            '<button class="vjs-errors-ok-button" data-i18n="OK"></button>' +
          '</div>' +
        '</div>';

      if (player.width() <= 600 || player.height() <= 250) {
        display.addClass('vjs-xs');
      }

      on(display.el().querySelector('.vjs-errors-close-button'), 'click', function() {
        display.hide();
      });
      on(display.el().querySelector('.vjs-errors-ok-button'), 'click', function() {
        display.hide();
      });

      if (settings.locale !== 'en' && settings.locale !== 'en-US' && settings.localizations[settings.locale]) {
        // Localize Headline
        if (settings.localizations[settings.locale][this.error().code].headline) {
          display.el().querySelector('.vjs-errors-headline').setAttribute('data-i18n',
            settings.localizations[settings.locale][this.error().code].headline);
        }
        // Localize Message
        if (settings.localizations[settings.locale][this.error().code].message) {
          display.el().querySelector('.vjs-errors-headline').setAttribute('data-i18n',
            settings.localizations[settings.locale][this.error().code].message);
        }
        // Localize Error Code Label
        if (settings.localizations[settings.locale]['error code']) {
          display.el().querySelector('.vjs-error-code').setAttribute('data-i18n',
            settings.localizations[settings.locale]['error code']);
        }
        // Localize Technical Details Label
        if (settings.localizations[settings.locale]['technical details'] && display.el().querySelector('.vjs-tech-details')) {
          display.el().querySelector('.vjs-tech-details').setAttribute('data-i18n',
            settings.localizations[settings.locale]['technical details']);
        }
      }
    });

    // Initialize custom error conditions
    initCustomErrorConditions(this, settings);
  });
})();
