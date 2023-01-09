OnLoad('/doh_js/html', function($){
  var jWin = $(window);
  Doh.meld_objects(Doh, {
    OnWindowResize:{},
    /**
     *  @brief Turns a string or jquery object into a doh object
     *
     *  @param [in] e jQuery String Selector, jQuery Selector Object, or Doh Object
     *  @return Doh Object or empty jQuery Selector Object
     */
    get_dobj: function( e ) {
      var obj = e;
      if( typeof e == 'string' ) {
        // if it's a string, then it's a jquery selector
        obj = Doh.jQuery(e);
      }
      if( obj instanceof Doh.jQuery ) {
        // if it's a jquery object, find the dobj that built it
        if( obj[0] ){
          if( obj[0].dobj ) obj = obj[0].dobj;
          // or make a new one for it
          // TO ANDY: I don't think we use this and I don't really like it.
          else obj = New({pattern:'element', e:obj, parent:obj.parent()}, 'parenting_phase');
        }
        // the jQuery selector object is empty, we didn't find an actual element
        else obj = false;
      }
      if(!InstanceOf(obj)){
        Doh.Warn('Doh.get_dobj could not find a doh object with:', obj);
      }
      // in any case, at least return e
      return obj || e;
    },
    /**
     *  @brief Refresh this window's cached sizes and boxes
     *
     *  @return the cache object
     *
     *  @details N/A
     */
    refresh_win: function() {
      // cache the window size on doh
      // window h/w is happily consistent

      Doh.WindowSizes = DWS = {w:jWin.width(), h: jWin.height()};
      // floor to err on the size of fitting
      // we stash this to keep from dividing by 2 as much as possible
      DWS.w2 = Math.floor(DWS.w*0.5);
      DWS.h2 = Math.floor(DWS.h*0.5);

      // In HTML land, the x,y coords 0,0 are in the top,left of the screen
      DWS.box = {
        t:0,
        l:0,
        r:DWS.w,
        b:DWS.h
      }

      // stash 'full' and 'half' css objects for jQuery and target_offset
      DWS.css = {top:DWS.h, left:DWS.w};
      DWS.center = {top:DWS.h2, left:DWS.w2};
      return DWS;
    },
  });

  // refresh the window sizes as soon as possible
  Doh.refresh_win();

  Doh.find_controller = function(object){
    // if the object is not of doh, then return false
    //NOTE: this keeps controls from cascading past their defined parents (e.g.: into vanilla html that contaiins them)
    if(!InstanceOf(object)) return false;
    if(object.parent){
      //if the parent is a controller, use that
      if(object.parent.is_controller) return object.parent;
      //otherwise, if the parent HAS a controller, use that
      if(object.parent.controller) return object.parent.controller;
      //otherwise, search for a controller
      return Doh.find_controller(object.parent);
    }
    // we have no parent, or we found no controller
    return false;
  }
  
  Pattern('control', 'hierarchy', {
    // advance the children machine to this phase when building
    machine_children_to: 'control_phase',
    // setup our phases for building controls
    phases: [
      'control_phase',
    ],
    control_phase: function(){
      // if we have a control name
      if(this.control){
        // find the controller
        var controller = Doh.find_controller(this);
        // if we find one, use it
        if(controller){
          this.controller = controller;
        } else {
          // otherwise, use the parent with warning
          Doh.Warn('hierarchy control: ', this, ' could not find a controller');
          this.controller = this.parent;
        }
        // ensure that our newly assigned controller has controls storage
        this.controller.controls = this.controller.controls || {};
        // add ourself to it
        this.controller.controls[this.control] = this;
      }
    }
  });
  
  var CSSClassCache = {};
  let originalPatternize = Doh.pattern;
  Pattern = Doh.pattern = function(name, inherits, idea) {
  //let off = function(name, inherits, idea) {
    var newPattern = originalPatternize(name, inherits, idea);
    if(!SeeIf.IsEmptyObject(newPattern.css) || SeeIf.HasValue(newPattern.style)){
      // build a class from .css and .style here
      // create a class name
      var className = 'doh-' + newPattern.pattern;
      var newCSS = {};
      //newPattern.css_old = Doh.meld_objects({},newPattern.css);
      //newPattern.style_old = newPattern.style;
      //newPattern.pattern_styles_old = newPattern.pattern_styles;
      // get styles, if any
      if(newPattern.style){
        newPattern.style.split(';').forEach((a) => {
          var oldPatterrn = newPattern;
          var b = a.split(':');
          if(SeeIf.HasValue(b[0]) && SeeIf.HasValue(b[1])){
            newCSS[(b[0]).trim()] = b[1].trim();
          }else{
            //Doh.Warn('Patterns failed parsing: '+ a);
          }
        });
      }
      
      for(var i in newPattern.css){
        if(i === 'z-index') continue;
        if(i === 'opacity') continue;
        if(SeeIf.IsNumber(newPattern.css[i])){
          Doh.Warn('Pattern (' + newPattern.pattern + ')found css number for: ' + i + ' of: ' + newPattern.css[i], newPattern);
        }
      }
      
      // get css, if any;
      Doh.meld_objects(newCSS, newPattern.css);
      
      // add our class to a stylesheet
      $.stylesheet('#dynamic  {.'+className+'}').css(newCSS);
      // add our class to the pattern's classes
      newPattern.classes = Doh.meld_arrays(newPattern.classes || [], [className]);
      // clear the properties so they aren't added to the final object
      newPattern.initial_css = newPattern.css;
      newPattern.css = {};
      newPattern.initial_style = newPattern.style;
      newPattern.style = '';
      
    }
    return newPattern;
  }
  
  Pattern('html', 'control', {
    meld_arrays: [
      'classes',
      'pattern_styles'
    ],
    meld_objects: [
      'css',
      'attrs',
    ],
    phases: [
      'append_phase',
    ],
    // e should be a jQuery [Element/Array]
    // or false for using a passed in selector
    e: false,
    // used when e = false and we are generating a new element
    tag: 'div',
    // provided for selectors
    id: '',
    // attributes to set on the element by name:key
    attrs: {},
    // should always be a number keyed array of classes, will be .unique()
    classes: ['doh'],
    // css will be deep copied so it is safe to send in to any element modifier
    css: {},
    // html content to be added before appending children
    html: '',

    object_phase:function(){
      // ensure that the parent is a setting, already set,
      // or the body
      this.parent = this.parent || 'body';
      if( typeof this.parent === 'string' ) {
        this.parent = Doh.get_dobj(this.parent);
      }
      // if our auto-built properties don't have a parent, make us the parent
      if(!this.parent) {
        if(this._auto_built_by) this.parent = this._auto_built_by;
      }
      // ensure that the element is a setting, already set, or a new jQuery element using this.tag
      this.e = this.e || $('<'+this.tag+'>');
      if( typeof this.e === 'string' ) {
        // if it's a string, then it's a jquery selector
        this.e = $(this.e);
      }
      // stash ourself on the DOM object for the Doh.get_dobj() function later
      this.e[0].dobj = this;

      // if we made it this far and still have no id, then we need to assign a new one
      if(this.e.length === 1 && !this.id) {
        var id = this.e.attr('id')
        if(id) { this.id = id; }
        else { this.id = 'dobj_'+Doh.new_id(); }
      }
    },
    pre_parenting_phase:function() {
      if(this.e) {
        // set style before css so it doesn't blow the css away
        if(this.style) this.set_style(this.style);

        this.e
          // add any classes
          .addClass(this.classes.join(' '))
          // merge in css
          .css(this.css)
          // apply attributes
          .attr(this.attrs)
          
        // only try and set html if it's actually set to something
        if(SeeIf.NotEmptyString(this.html)){
          // ... and there aren't already children
          if(this.e.children().length < 1) {
            // set inner text
            // WARNING: this will overwrite children
            this.e.html(this.html);
          } else {
            Doh.Warn(`html object tried to overwrite children with: "${this.html}"`,'\n',this);
          }
        }
        
        // set id for selectors/readability
        if(this.e.length === 1 && this.id) this.e.attr('id', this.id);
        // we rely on children waiting to be appended,
        // stash the intended machine state and use 'control_phase'
        if(this.machine_children_to !== 'control_phase'){
          this._machine_children_to = this.machine_children_to;
          this.machine_children_to = 'control_phase';
        }
      }
    },
    parenting_phase:function(){
      if(this._machine_children_to){
        // if we stashed the intended state, restore it here
        this.machine_children_to = this._machine_children_to;
      } else {
        // tell the append to machine children to append_phase
        this.machine_children_to = 'append_phase';
      }
    },
    append_phase:function(){
      // as long as we haven't already appended
      if(!this.machine.append_phase) {

        // convert the parent to a doh object if not already one
        if( typeof this.parent === 'string' || this.parent instanceof Doh.jQuery) {
          this.parent = Doh.get_dobj(this.parent);
        }
        // if this is a string, convert it to a jQuery object
        if( typeof this.e === 'string' ) {
          this.e = $(this.e);
          // if we had to convert, then stash ourself on the DOM object, just in case
          this.e[0].dobj = this;
        }
      }
      if(!this.parent.e){
        this.parent = Doh.get_dobj(this.parent);
      }
      // put in parent (can be used to relocate as well)
      this.parent.e.append(this.e);

      // loop through the children and attempt to place them
      for(var i in this.children) {
        if(i === 'length') continue;
        // build the children up or machine them forward
        this.children[i] = New(this.children[i], this.machine_children_to);
      }
    },
    get_style:function(){
      return this.e[0].style.cssText;
    },
    set_style:function(style){
      this.e[0].style.cssText = style;
    },
    // set_css({prop:val}) OR set_css(prop, val) OR set_css("prop:val;")
    set_css: function(o, p = undefined) {
      if(typeof p !== 'undefined') {
        this.e[0].style[o] = p; 
      } else if(typeof o === 'string') {
        o.split(';').forEach((a) => {
          let b = a.split(':');
          this.e[0].style[(b[0])] = b[1]; 
        });
      } else 
        this.e.css(o);
    },
    is_visible: function(){
      return this.e.is(":visible");
    },
    // cache the sizes of the object for the current moment
    sizes:function () {
      // jQuery outerWidth and outerHeight give us padding and border, but not margin
      // since doh is absolute position, only margin does NOT affect the layout
      // therefore, we must use the outer measurements to get acurate positions
      var s = this.size = {w:this.e.outerWidth(), h:this.e.outerHeight()};
      // we use floor here because a pixel shy is almost always better than a pixel over
      //this.size.w2 = Math.floor(this.size.w/2);
      //this.size.h2 = Math.floor(this.size.h/2);
      s.w2 = s.w*0.5;
      s.h2 = s.h*0.5;

      // cache the internal size for containers
      var i_s = this.inner_size = {w:this.e.width(), h:this.e.height()};
      i_s.w2 = i_s.w*0.5;
      i_s.h2 = i_s.h*0.5;

      return this;
    },
    offsets:function () {
      // cache the current jQuery offsets
      this.offset = this.e.offset();
      return this;
    },
    // cache the boxes of the object for the current moment
    boxes:function () {
      //ensure that we have sizes and offsets
      this.sizes();
      this.offsets();
      var s = this.size, o = this.offset;
      // calculate the box against it's actual coords
      // cache a jQuery friendly set of targeted box offsets for use in .css calls
      this.box = {
        t:o.top,
        l:o.left,
        r:o.left+s.w,
        b:o.top+s.h,
        css:{
          top:o.top,
          left:o.left
        }
      };
      return this.box;
    },
  });

  Pattern('HTMLPosition', 'element', {
    meld_objects:['position'],
    place:function(opts){
      opts = opts || this.position;
      let newOpts = {};
      if(InstanceOf(opts.of)) newOpts.of = opts.of.e;
      if(InstanceOf(opts.within)) newOpts.within = opts.within.e;
      this.e.position({...opts, ...newOpts});
    }
  });

  Doh.AnimationQueues = {doh:[]};
  Doh._AnimationQueues = {};
  Doh.animation_functionalizer = function(oThat, oAnim){
    var that = oThat, anim = oAnim;

    var opts = $.extend({},{duration:400},that.animation_options);

    if(typeof anim === 'string'){
      if(anim === 'delay') return function(next){that.machine('animation_phase');setTimeout(next, opts.duration)};
      return function(next){that.machine('animation_phase');that.e[anim]($.extend({},opts,{complete:next}));};
    }

    if(typeof anim === 'function'){
      return function(next){that.machine('animation_phase');anim.apply(that);next();};
    }

    return function(next){
      that.machine('animation_phase');
      that.e.animate(anim, $.extend({},opts,{complete:next}));
    };
  }
  Doh.run_animation_queue = function(queue_name){
    if(!queue_name){
      Doh.warn('Tried to start a "false" animation queue.');
      return;
    }
    queue = Doh.AnimationQueues[queue_name];
    if(Doh._AnimationQueues[queue_name]){

      if(!Doh._AnimationQueues[queue_name][0]){
        Doh._AnimationQueues[queue_name] = false;
        return;
      }
      var next = Doh._AnimationQueues[queue_name][0];
      Doh._AnimationQueues[queue_name] = Doh._AnimationQueues[queue_name].slice(1);
      next(Doh.run_animation_queue.bind(this, queue_name));

    } else {
      Doh._AnimationQueues[queue_name] = [];
      var q = false, j = 0;
      if(queue)
        for(var i = 0; i < queue.length; i++){
          if(InstanceOf(queue[i])){
            // it's a doh object,
            // the animation is either an array of animations,
            // or a single animation
            q = queue[i].animation;
            if(!Array.isArray(q)) q = [q];
            // its an array of animations
            j = 0;
            for(j; j < q.length; j++){
              Doh._AnimationQueues[queue_name].push(Doh.animation_functionalizer(queue[i],q[j]));
            }
          }
        }
      Doh.run_animation_queue(queue_name);
    }
  }
  Pattern('animation_queue', 'object', {
    queue: false,
    animation:[],
    animation_options: {},
    meld_objects: ['animation_options'],
    phases:['animation_phase'],
    animation_phase: function() {
      this.queue = this.queue || 'doh';
      if(!Doh.AnimationQueues[this.queue])Doh.AnimationQueues[this.queue]=[];
      Doh.AnimationQueues[this.queue].push(this);
    }
  });

  Pattern('animated_element', ['element','animation_queue'], {
    machine_children_to: 'animation_phase'
  });

  Pattern('span', 'element', {tag:'span'});

  Pattern('input', 'element', {
    tag: 'input'
  });

  Pattern('input_value', {
    available_properties:{'value':'string to put in the value HTML attribute'},
    pre_parenting_phase: function(){
      if (typeof this.value !== 'undefined') this.attrs.value = this.value;
    }
  });

  Pattern('text', ['input', 'input_value'], {
    attrs: {type: 'text'},
  });

  Pattern('password', ['input', 'input_value'], {
    placeholder: '',
    object_phase: function() {
      this.attrs = {type: 'password', placeholder: this.placeholder};
    }
  });


  Pattern('hidden', ['input', 'input_value'], {
    attrs: {type: 'hidden'}
  });

  Pattern('textarea', ['input'], {
    available_properties:{'value':'string to put in the textarea'},
    tag: 'textarea',
    append_phase: function () {
      if (typeof this.value !== 'undefined')
        this.e.val(this.value);
    }
  });

  Pattern('click', 'element', {
    wait_for_mouse_up:false,
    css:{'cursor':'default'},
    append_phase: function(){
      if(this.click){
        var that = this;
        if(this.wait_for_mouse_up) {
          this.e.mouseup(function(){return that.click.apply(that,arguments);});
        } else 
          this.e.click(function(){return that.click.apply(that,arguments);});
        // CHRIS -- test this
        // if the click function returns false, the click doesn't propagate
      }
    }
  });
  Pattern('button', ['click', 'disableable'], {
    tag: 'button',
    available_properties: {'value':'label of the button', 'button_options':'jQuery UI Button options object'},
    meld_objects: ['button_options'],
    button_options: {},
    pre_parenting_phase: function(){
      if (typeof this.value !== 'undefined' && typeof this.button_options.label == 'undefined') this.button_options.label = this.value;
    },
    append_phase: function(){
      this.e.button(this.button_options);
    },
    change_title: function(wut) {
      if(this.e)
        this.e[0].innerHTML = wut;
    },
  });

  Pattern('animated_next_button', ['animated_element','button','scenario_queue_stepper'], {
    animation:['fadeIn'],
    click_queue:false,
    click_animation:['fadeOut',function(){if(this.next_queue)Doh.run_animation_queue(this.next_queue);}],
    next_queue:false,
    meld_methods:['click'],
    append_phase:function(){
      this.click_queue = this.click_queue || this.id+'_click';
      this.original_queue = this.queue;
      this.original_animation = this.animation;

      this.queue = this.click_queue;
      this.inherited.animation_queue.animation_phase.apply(this);
      this.queue = this.original_queue;
    },
    pre_click:function(){
      this.animation = this.click_animation;
    },
    click:function(){
      Doh.run_animation_queue(this.click_queue);
      this.animation = this.original_animation;
    }
  });

  Pattern('disabled', 'element', {
    attrs: {disabled:'disabled'}
  });

  Pattern('disableable', 'element',{
    disable: function(aBool) {
      if(this.e)
        if(aBool) {
          //this.e.prop('disabled',true).css('opacity',0.3);
          this.e.addClass('ui-state-disabled');
        } else {
          //this.e.prop('disabled',false).css('opacity',1.0);
          this.e.removeClass('ui-state-disabled');
       }
    }
  });

  Pattern('disabled_text', ['text', 'disabled']);

  Pattern('select', ['input', 'disableable'], {
    required_properties:{'options':'object array of options keyed by option title, value used as option value'},
    available_properties:{'value':'string of the option value that should be default selected'},
    tag: 'select',
    pre_parenting_phase: function() {
      for(var i in this.options){
        this.children.push({
          pattern: 'option',
          html: i,
          value: this.options[i]
        });
      }
    },
    append_phase: function () {
      if (this.value) {
        this.e.find("[value='" + this.value + "']").attr({
          selected: 'selected'
        });
      }
      if (this.change) {
        var that = this;
        this.e.bind('change', function(){that.change.apply(that, arguments)});
        window.setTimeout(this.change, 0);
      }
    },
  });

  Pattern('option', 'element', {
    tag: 'option',
    append_phase: function () {
      if (typeof this.value !== 'undefined') this.e.val(this.value);
    }
  });

  Pattern('select_with_other_field', 'select', {
    required_properties:{
      other_value: 'value of the option that shows "other" field when selected',
      other_selector: 'jquery selector for "other" field'
    },
    append_phase: function () {
      var that = this;
      var chg = function () {
        var form_dobj = that.e.parentsUntil('.form').parent()[0].dobj;
        var container = that.e.parent().parent();
        var other_field = container.find(that.other_selector);
        var value = that.e.val();
        if (value == that.other_value) {
          // if the select is on the "other" value, show the "other" field
          other_field.show();
        } else {
          // otherwise, clear the "other" field and hide it
          if(form_dobj.clear_fields) form_dobj.clear_fields(other_field);
          other_field.hide();
        }
      };
      this.e.bind('change', chg);
      window.setTimeout(chg, 0);
    }
  });

  Pattern('checkbox', ['input', 'input_value'], {
    attrs: {type: 'checkbox'},
  });

  Pattern('checkbox2', ['input', 'input_value'], {
    attrs: {type: 'checkbox'},
    append_phase: function(){
    //  this.e.button(this.button_options);
      if(this.click){
        var that = this;
        this.e.click(function(){that.click.apply(that,arguments);});
      }
    },
  });

  Pattern('date', 'text', {
    available_properties:{'value':'string of the option value that should be default selected'},
    append_phase: function(){
      var that = this;
      this.e.removeClass('hasDatepicker');
      this.date_format = this.date_format || 'yy-mm-dd';
      this.e.datepicker({
        showOn: "focus",
        dateFormat: this.date_format,
        constrainInput: true,
        changeMonth: true,
        changeYear: true,
        minDate: '01/01/1900',
        yearRange: this.year_range || 'c-100:c',
        onClose: function(date_str){
          if(date_str) that.e.val(date_str);
          that.e.trigger('input');
        }
      });
    }
  });

  Pattern('date_range_from', 'date', {
    append_phase: function(){
      var that = this;
      this.e.on('change', function(){
        $(that.date_range_to).datepicker("option", "minDate", date_range_get_date(this, that.date_format));
      });
    }
  });

  Pattern('date_range_to', 'date', {
    append_phase: function(){
      var that = this;
      this.e.on('change', function(){
        $(that.date_range_from).datepicker("option", "maxDate", date_range_get_date(this, that.date_format));
      });
    }
  });

  function date_range_get_date(e, dateFormat) {
    var date;
    try {
      date = $.datepicker.parseDate(dateFormat, e.value);
    } catch(error) {
      date = null;
    }
    return date;
  }

  Pattern('slider', 'element', {
    available_properties: {'slider_options':'jQuery UI Slider options object'},
    meld_objects: ['slider_options'],
    slider_options: {},
    append_phase: function(){
      this.e.slider(this.slider_options);
    }
  });

  Pattern('field', 'element', {
    tag: 'span'
  });

  Pattern('label', 'element', {
    tag: 'span',
    set_html: function(s) {
      this.html = s;
      if (this.e.children().length < 1) {
        // set inner text
        // WARNING: this will overwrite children
        this.e.html(this.html);
      } else {
        Doh.Warn(`set_html would have overwritten children with: "${this.html}"`, '\n', this);
      }
    }
  });

  Pattern('html_image','span', {
    src_path: false,
    tag: 'img',
    append_phase: function() {
      if(this.src_path)
        this.set_src(this.src_path);
    },
    set_src: function(src_path) {
      this.src_path =  src_path;
      this.e[0].setAttribute('src',this.src_path);
    }
  });

  Pattern('fieldset', 'element', {
    available_properties:{
      'legend':'string use as the fieldset "legend" or title',
      'children':'object or array of children objects or patterns that will be placed in the fieldset'
    },
    tag: 'fieldset',
    pre_parenting_phase: function () {
      var new_children = {};
      new_children.push({
        tag: 'legend',
        html: this.legend
      });
      for(var i in this.children){
        if(i == 'length') continue;
        new_children[i] = this.children[i];
      }
      this.children = new_children;
    }
  });

  //TODO: refactor for pre_parenting_phase
  Pattern('form_messages', 'element', {
    pre_parenting_phase: function(){
      var that = this;
      for(var i in this.messages){
        this.children.push({
          pattern: 'form_msg',
          html: this.messages[i]
        });
      }
      setTimeout(function(){
        that.e.slideUp();
      }, 10000);
    }
  });

  Pattern('form_msg', 'element',);

  //TODO: refactor for pre_parenting_phase
  Pattern('tabs', 'element', {
    tabs: {},
    required_properties:{
      'tabs':'Object containing tabs, keyed by tab label, value is tab content'
    },
    pre_parenting_phase: function(){
      var tab_labels = {}, tab_content = {}, active = '';
      for(var i in this.tabs){
        this.tabs[i].css = {clear: 'both'};
        if(i === 'Normal'){
          active = 'active'
        } else {
          active = '';
          this.tabs[i].css.display = 'none';
        }
        this.tabs[i].id = 'tab_'+i+'_content';
        tab_content[i] = this.tabs[i];
        tab_labels[i] = {
          pattern: 'button',
          value: i,
          classes: [active],
          css: {float: 'left'},
          id: 'tab_' + i + '_button',
          name: i,
          append_phase: function(){
            var that = this;
            //var tab_labels_inner = tab_labels, tab_content_inner = tab_content;
            this.e.click(function(){
              //console.log(that);
              var cur_button, cur_content;
              for(var k in tab_content){
                cur_button = $('#tab_' + k + '_button');
                cur_content = $('#tab_' + k + '_content');
                if(that.name == k){
                  cur_button.addClass('active');
                  cur_content.show();
                } else {
                  cur_button.removeClass('active');
                  cur_content.hide();
                }
              }

            });
          }
        };
      }
      this.children = tab_labels;
      for(var j in tab_content){
        this.children['tab_'+j+'_content'] = tab_content[j];
      }
    }
  });

  Pattern('dialog', 'element', {
    meld_objects:['dialog_options'],
    dialog_options:{height:'auto',width:'auto'},
    append_phase: function(){
      /*
        see https://api.jqueryui.com/dialog/ 

        position: {
            my: 'left',
            at: 'left',
            of: this.e[0]
          },
         title: 'foo',
         classes: {
          "ui-dialog": "disrupter_site",
          "ui-dialog-titlebar": "disrupter_site",
          "ui-dialog-title": "disrupter_site",
          "ui-dialog-buttonpane": "disrupter_site",
        }
         Note:  there is a deprecated "dialogClass" option which should be avoided

      */
      this.e.dialog(this.dialog_options);
    }
  });

  Pattern('modal_dialog','dialog',{
    tag:'pre',
    is_controller:true,
    on_close:function(){},
    perform_close:function(){
      this.e.dialog('close');
      this.on_close();
    },
    object_phase:function(){
      var aDialog = this;
      this.dialog_options = Doh.meld_objects(this.dialog_options,{
        modal:'true',
        buttons:{
          "OK":function(){
            aDialog.perform_close();
          }
        },

      });
    },
    append_phase:function(){
      var aDialog = this;
      this.e.keypress(
        function(event){
           var keycode = (event.keyCode ? event.keyCode : event.which);
           if(keycode == 13) {
            aDialog.perform_close();
           }
         }
      );
    },
  });



  Pattern('drag', 'element', {
    meld_methods:['drag_start','drag_drag','drag_stop'],
    css: {cursor: "move"},
    drag_start:function(event, ui){
      this._original_z_index = this.e.css("z-index");
      this.e.css({'z-index':110});
      //console.log('drag start');
    },
    drag_drag:function(event, ui) {
      //console.log('drag drag');
    },
    drag_stop:function(e,f) {
      this.e.css({'z-index':this.css['z-index']});
       this.e.css({'z-index':this._original_z_index});
       this._was_gedragged = true;
    },
    append_phase: function(){
      this.e.draggable({
        start: this.drag_start.bind(this),
        drag: this.drag_drag.bind(this),
        stop: this.drag_stop.bind(this)
      });    
    },
    enableDrag: function() {
      this.e.draggable('enable');
    },
    disableDrag: function() {
      this.e.draggable('disable');
    },
  });

  Pattern('draggable', 'drag',{});

  Pattern('resizable', 'element', {
    meld_methods:['resize_start','resize','resize_stop'],
    resize_start:function(event, ui){
    },
    resize:function(event, ui) {
    },
    resize_stop:function() {
    },
    append_phase: function(){
      this.e.resizable({
        start: this.resize_start.bind(this),
        resize: this.resize.bind(this),
        stop: this.resize_stop.bind(this)
      });    
    },
    enableResize: function() {
      this.e.resizable('enable');
    },
    disableDResize: function() {
      this.e.resizable('disable');
    },
  });

  Pattern('hover', 'element', {
    meld_methods:['hover_over','hover_out'],
    hover_over: function(){},
    hover_out: function(){},
    append_phase: function(){
      // make us hoverable
      this.e.hover(this.hover_over.bind(this), this.hover_out.bind(this));



      //window.setTimeout(this.hover_over, 0); // this fixes a race issue at launch but means hover will get called at launch one time
    },
  });

  Pattern('hover_delayed', 'element', {
    delay_time_ms: 600,
    meld_methods:['hover_over','hover_out'],
    _timer: null,
    delays_hover_over: function() {
      let that = this;
      this._timer = setTimeout(function() {
        that.hover_over();
    }, this.delay_time_ms);
    },
    hover_over: function(){

    },
    hover_out: function(){
      clearTimeout(this._timer);
    },
    append_phase: function(){
      // make us hoverable
      this.e.hover(this.delays_hover_over.bind(this), this.hover_out.bind(this));
      //window.setTimeout(this.delays_hover_over, 0); // this fixes a race issue at launch but means hover will get called at launch one time
    },
  });


    Doh.jQuery(window).resize(function(e){
      Doh.refresh_win();
      for(var id in Doh.OnWindowResize) {
        Doh.OnWindowResize[id].window_resize.call(Doh.OnWindowResize[id], e);
      }
    });

    var jBody = Doh.jQuery('body');
    Doh.body = New('html',{tag:'body',e:jBody,parent:jBody.parent()}, 'parenting_phase');                 
});

