'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
      ' Licensed <%= pkg.license %> */\n',
    clean: {
      files: ['dist']
    },
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: 'src/*.js',
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    connect: {
      dev: {
        options: {
          port: 9999,
          keepalive: true
        }
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    karma: {
      test: {
        options: {
          configFile: 'test/karma.config.js'
        }
      }
    },
    jshint: {
      gruntfile: {
        options: {
          node: true
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['src/**/*.js']
      },
      test: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'karma']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'karma']
      }
    },
    vjslanguages: {
      defaults: {
        files: {
          'dist/lang': ['lang/*.json']
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test',
                     ['clean',
                      'jshint',
                      'karma']);
  grunt.registerTask('default',
                     ['test',
                      'vjslanguages',
                      'concat',
                      'uglify']);
};
