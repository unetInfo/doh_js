// this is for loading into a nodejs system
if(typeof global != 'undefined'){
  top = global;
  var Doh = top.Doh = {};
  var glob = top.glob = {};
}

Doh = Doh || {};
glob = glob || {};
SeeIf = SeeIf || {};

if(typeof exports != 'undefined') {
  exports = top.Doh;
}

/* **** Prepare Doh **** */
// the most important function in Doh:
Doh.meld_objects = function(destination){
  destination = destination || {}; // this may seem unneccesary but OH IS IT EVER NECCESSARY
  var obj, i;
  for(let arg in arguments){
    obj = arguments[arg];
    if(obj === destination) continue;
    i = '';
    for(i in obj){
      destination[i] = obj[i];
    }
  }
  return destination;
};

OnLoad('/doh_js/see_if', function($){
// enshrine the definitions of variable states
  var SeeIf_Templates = {
    // undefined refers to objects that have not been defined anywhere in code yet
    'IsUndefined':(value) => `typeof ${value} === 'undefined'`,
    // null is supposed to refer to objects that have been defined, but have no value. In truth because of "falsey" values, it can have other meanings
    'IsNull':(value) => `${value} === null`,
    // defined is supposed to refer to having a usable reference. undefined means without reference. null references are still unusable in JS, so defined nulls should demand special handling
    'IsDefined':(value) => `(typeof ${value} !== 'undefined' && ${value} !== null)`,
    // false refers to the binary 0 state (Boolean)
    'IsFalse':(value) => `${value} === false`,
    // true refers to the binary 1 state (Boolean)
    'IsTrue':(value) => `${value} === true`,
    // falsey refers to values that equal binary 0, even if represented by a different datatype. Falsey values include: Undefined, Null, False, '', 0, -1...[negative numbers]
    'IsFalsey':(value) => `!${value}`,
    // truey referes to values that equal binary 1, even if represented by a different datatype. Truey values include: True, HasValue, 1...[positive numbers]
    'IsTruey':(value) => `${value} == true`,
    // boolean refers to values that are actual boolean datatype
    'IsBoolean':(value) => `typeof ${value} === 'boolean'`,
    // Number refers to values that are a number datatype EXCEPT NaN (Not a Number)
    'IsNumber':(value) => `(typeof ${value} === 'number' && !isNaN(${value}))`,
    // string refers to values that are actual string datatype
    'IsString':(value) => `typeof ${value} === 'string'`,
    // array refers to values that are actual array datatype
    'IsArray':(value) => `Array.isArray(${value})`,
    // iterable refers to values that define a Symbol iterator so that native methods can iterate over them
    'IsIterable':(value) => `((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function')`,
    // arraylike refers to values that act like arrays in every way. they can be used by native array methods
    'IsArrayLike':(value) => `(((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function') && typeof ${value}.length === 'number' && typeof ${value} !== 'string')`,
    // function refers to values that are actual functions
    'IsFunction':(value) => `typeof ${value} === 'function'`,
    // literal refers to values that are static literals. Strings, booleans, numbers, etc. Basically anything that isn't an object or array. flat values.
    'IsLiteral':(value) => `typeof ${value} !== 'object'`,
    // objectobject refers to values that are complex objects with named properties. No flat values or number-keyed lists. 
    'IsObjectObject':(value) => `(typeof ${value} === 'object' && toString.call(${value}) == '[object Object]')`,
    // to-be-replaced:
    // emptyobject refers to values that are objectobject or arraylike but have no properties of their own (empty of named properties that aren't javascript native)
    'IsEmptyObject':(value) => `${value}`,
    // dohobject refers to values that are a complex objectobject which was built with Doh
    'IsDohObject':(value) => `InstanceOf(${value})`,
    // keysafe refers to values that are safe for use as the key name in a complex objectobject
    'IsKeySafe':(value) => `(typeof ${value} === 'string' || (typeof ${value} === 'number' && !isNaN(${value})))`,
    // emptystring refers to values that are string literals with no contents
    'IsEmptyString':(value) => `${value} === ''`,
    // hasvalue refers to values that are defined and notemptystring. specifically this includes 0 and negative numbers where truey does not.
    'HasValue':(value) => `((typeof ${value} !== 'undefined' && ${value} !== null) && ${value} !== '')`,
    
    // Not conditions, interestingly different
    'NotUndefined':(value) => `typeof ${value} !== 'undefined'`,
    'NotNull':(value) => `${value} !== null`,
    'NotFalse':(value) => `${value} !== false`,
    'NotTrue':(value) => `${value} !== true`,
    'NotBoolean':(value) => `typeof ${value} !== 'boolean'`,
    'NotNumber':(value) => `(typeof ${value} !== 'number' || isNaN(${value}))`,
    'NotString':(value) => `typeof ${value} !== 'string'`,
    'NotArray':(value) => `!Array.isArray(${value})`,
    'NotIterable':(value) => `!((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function')`,
    'NotArrayLike':(value) => `!(((typeof ${value} !== 'undefined' && ${value} !== null) && typeof value[Symbol.iterator] === 'function') && typeof ${value}.length === 'number' && typeof ${value} !== 'string')`,
    'NotFunction':(value) => `typeof ${value} !== 'function'`,
    'NotLiteral':(value) => `typeof ${value} === 'object'`,
    'NotObjectObject':(value) => `!(typeof ${value} === 'object' && toString.call(${value}) == '[object Object]')`,
    'NotDohObject':(value) => `!InstanceOf(${value})`,
    'NotKeySafe':(value) => `!(typeof ${value} === 'string' || (typeof ${value} === 'number' && !isNaN(${value})))`,
    'NotEmptyString':(value) => `${value} !== ''`,
    'LacksValue':(value) => `(typeof ${value} === 'undefined' || ${value} === null || ${value} === '')`
  };
  Doh.meld_objects(SeeIf_Templates, {
    'NotDefined':SeeIf_Templates.IsUndefined,
    'NotFalsey':SeeIf_Templates.IsTruey,
    'NotTruey':SeeIf_Templates.IsFalsey,
    'IsSet':SeeIf_Templates.IsDefined,
    'NotSet':SeeIf_Templates.IsUndefined,
  });
  for(let i in SeeIf_Templates){
    SeeIf[i] = new Function('value', `return ${SeeIf_Templates[i]('value')}`);
  }
  SeeIf.IsEmptyObject = function(value) {
    if(SeeIf.IsDefined(value)) {
      if (value.length && value.length > 0) { 
        return false;
      }

      for (var key in value) {
        if (hasOwnProperty.call(value, key)) {
          return false;
        }
      }
    }
    return true;    
  };
  SeeIf.NotEmptyObject = function(value){
  return !SeeIf.IsEmptyObject(value);
};
});

OnLoad('/doh_js/core', function($){
  
  Doh.meld_objects(Doh, {
    
    ModuleCurrentlyRunning: '/doh_js/core',
    
    Version:'2.0a',
    
    PatternsByModule: {},

    grep: function( elems, callback, inv ) {
      var ret = [];
      // Go through the array, only saving the items
      // that pass the validator function
      for ( var i = 0, length = elems.length; i < length; i++ ) {
        if ( !inv !== !callback( elems[ i ], i ) ) {
          ret.push( elems[ i ] );
        }
      }
      return ret;
    },

    in_array: function( elem, array ) {
      
      if ( typeof array == 'undefined') return -1;
      
      if ( array.indexOf ) {
        return array.indexOf( elem );
      }

      for ( var i = 0, length = array.length; i < length; i++ ) {
        if ( array[ i ] === elem ) {
          return i;
        }
      }

      return -1;
    },
    
    _log: function(args, log_type, logger_method, logger){
      log_type = log_type || '';
      logger_method = logger_method || 'log';
      logger = logger || console;
      var logger_args = [log_type];
      for(var i in args){
        if(i === 'length') continue;
        logger_args.push(args[i]);
      }
      logger[logger_method].apply(logger, logger_args);
    },
    log: function(){
      Doh._log(arguments, 'Doh:', 'log');
    },
    /**
     *  @brief return a custom Doh Error
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return Patterns.error object
     *
     *  @details
     *  Doh.error('error message', object1, 'some string', objectN, ...);
     */
    error: function(){
      Doh._log(arguments, 'Doh ERROR:', 'error');
      // build and return the custom error
      //return New({pattern:'error',args:arguments});
    },
    /**
     *  @brief return a custom Doh Warning
     *
     *  @param [in] context, context, ...   object(s) of relevence to the error
     *  @return Patterns.error object
     *
     *  @details
     *  Doh.error('error message', object1, 'some string', objectN, ...);
     */
    warn: function(){
      Doh._log(arguments, 'Doh Warning:', 'warn');
      //if(Patterns.warning)
      //  return New({pattern:'warning',args:arguments});
    },

    /**
     *  @brief Get a new id
     *
     *  @return A new unique id
     */
    NewIdCounter:0,
    new_id: function () {
      return this.NewIdCounter += 1;
    },
    /**
     *  @brief Turn a dot delimited name into a deep reference on 'base'
     *
     *  @param [in] base    The object to get a deep reference to
     *                      pass TRUE to 'base' and it will return the last key of the split
     *  @param [in] var_str A dot-delimited string
     *  @return A deep reference into 'base' or the last key of the split
     */
    parse_reference: function(base, var_str){
      var values = base;
      var var_arr = new String(var_str).split('.');
      // pass TRUE to 'base' and it will return the last key of the split
      if(base===true) return var_arr[var_arr.length-1];
      for(var i=0; i < var_arr.length; i++)
      values = values[var_arr[i]];

      return values;
    },

    array_move: function(array, from_index, to_index) {
      array.splice(to_index, 0, array.splice(from_index, 1)[0]);
      return array;
    },

    // allow storage of patterns
    Patterns: {},
    
    // This is used by the builder to a mix a pattern into a new instance of an object
    mixin_pattern: function(destination, pattern){

      if(Patterns[pattern]){
        if(!InstanceOf(destination, pattern)){
          // check for invalid mixin
          Doh.meld_ideas(destination, Patterns[pattern]);

          destination.inherited[pattern] = Patterns[pattern];
        }
      } else {
        Doh.Warn('Doh.mixin_pattern(',destination,',',pattern,') did not find the pattern');
      }
    },
    
    extend_inherits: function(inherits){
      var extended = {};
      if(SeeIf.NotObjectObject(inherits)) inherits = Doh.normalize_inherits({}, inherits);
      for(var i in inherits){
        if(!Patterns[i]) throw Doh.Error(i+' not defined. Pattern is missing...'); // CHRIS:  Andy added this error msg, is there a better way?
        Doh.meld_objects(extended, Doh.extend_inherits(Patterns[i].inherits));
      }
      Doh.meld_objects(extended, inherits);
      return extended;
    },

    array_unique: function(arr){
      // reduce the array to contain no dupes via grep/in_array
      return Doh.grep(arr,function(v,k){
          return Doh.in_array(v,arr) === k;
      });
    },

    object_keys_from_array_values: function (arr){
      var obj = {};
      arr = arr || [];
      for(var i=0; i<arr.length; i++){
        obj[arr[i]] = true
      }
      return obj;
    },

    meld_arrays: function(destination, arr, force_new){

      arr = arr || [];
      if(force_new) return Doh._meld_arrays(destination, arr);

      destination = destination || [];
      // loop over arr
      for(var i=0; i<arr.length; i++){
        // if the value is not in destination
        if(Doh.in_array(arr[i], destination) == -1){
          // add it
          destination.push(arr[i]);
        }
      }
      return destination;
    },
    _meld_arrays: function(arr1, arr2){
      var destination = Doh.meld_objects([], arr1);
      // loop over arr
      for(var i=0; i<arr2.length; i++){
        // if the value is not in arr1
        if(Doh.in_array(arr2[i], arr1) == -1){
          // add it to the destination
          destination.push(arr2[i]);
        }
      }
      return destination;
    },

    // ADD COMMENTS HERE
    // old method of nesting closures
    meld_methods: function(obj, method, extension){
        return function(){
          method.apply(obj, arguments);
          extension.apply(obj, arguments);
          return obj;
        }
    },

    // given an object and method name, return an array of function references for
    // inherited patterns that implement the named method
    meld_method_stack: function(object, method_name){
      let meld_method_order = [], pre_meld_method_order = [], ilist = object.inherited;
      for(let i in ilist){
        if(object.inherited[i]['pre_'+method_name]) pre_meld_method_order.push(object.inherited[i]['pre_'+method_name]);
        if(object.inherited[i][method_name]) meld_method_order.push(object.inherited[i][method_name]);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    // return a closure for obj[method_name] that will call each function in method_stack
    meld_method: function(obj, method_stack){
      // if the stack is a string, then we are trying to meld a method from object.inherited
      let method_name = false;
      if(typeof method_stack === 'string'){
        method_name = method_stack;
        method_stack = Doh.meld_method_stack(obj, method_name);
      }
      let melded_method = function(){
        // this melder always does the same thing:
        //  walk the method stack and apply each method to the bound object
        let len = method_stack.length;
        for(let i=0;i<len;i++){
          method_stack[i].apply(obj, arguments);
        }
        return obj;
      };
      melded_method.update_meld_stack = function(newStack){
        if(!newStack && method_name){
          method_stack = Doh.meld_method_stack(obj, method_name);
          return;
        }
        method_stack = newStack;
      };
      return melded_method;
    },
    // update meld_methods and phases of obj
    update_meld_methods: function(obj){
      let mms = obj.meld_methods || [], melders = [...mms, ...obj.phases], len = melders.length;
      for(let i=0;i<len;i++){
        // conditionally update only the method stack
        if(typeof obj[melders[i]] === 'function')if(typeof obj[melders[i]].update_meld_stack === 'function'){
          obj[melders[i]].update_meld_stack();
        }
        obj[melders[i]] = Doh.meld_method(obj, melders[i]);
      }
    },

    /*

                               ,,        ,,     ,,        ,,                           
                             `7MM      `7MM     db      `7MM                           
                               MM        MM               MM                           
    `7MMpMMMb.pMMMb.  .gP"Ya   MM   ,M""bMM   `7MM   ,M""bMM  .gP"Ya   ,6"Yb.  ,pP"Ybd 
      MM    MM    MM ,M'   Yb  MM ,AP    MM     MM ,AP    MM ,M'   Yb 8)   MM  8I   `" 
      MM    MM    MM 8M""""""  MM 8MI    MM     MM 8MI    MM 8M""""""  ,pm9MM  `YMMMa. 
      MM    MM    MM YM.    ,  MM `Mb    MM     MM `Mb    MM YM.    , 8M   MM  L.   I8 
    .JMML  JMML  JMML.`Mbmmd'.JMML.`Wbmd"MML. .JMML.`Wbmd"MML.`Mbmmd' `Moo9^Yo.M9mmmP' 


  */                                     


    meld_ideas:function(destination, idea, skip_methods) {
      idea = idea || {};
      var i,

      // build name-keyed objects of the melded value lists
      meld_arrays = Doh.object_keys_from_array_values(Doh.meld_arrays(destination.meld_arrays, idea.meld_arrays, true)),

      meld_objects = Doh.object_keys_from_array_values(Doh.meld_arrays(destination.meld_objects, idea.meld_objects, true)),

      meld_methods = Doh.object_keys_from_array_values(Doh.meld_arrays(destination.meld_methods, idea.meld_methods, true)),
      meld_phases = Doh.object_keys_from_array_values(Doh.meld_arrays(destination.phases, idea.phases, true));

      // loop over the idea and decide what to do with the properties
      i = '';
      for(i in idea){
        if(idea[i] !== undefined){
          if(meld_arrays[i] || (Array.isArray(idea[i]) && !idea[i].length)){
            // it's a melded array or an empty default
            destination[i] = Doh.meld_arrays(destination[i], idea[i]);
            continue;
          }
          if(meld_objects[i] || (typeof idea[i] == 'object' && !Array.isArray(idea[i]) && SeeIf.IsEmptyObject(idea[i]))){
            // it's a melded object or an empty default
            destination[i] = Doh.meld_objects(destination[i], idea[i]);
            continue;
          }
          if(meld_methods[i] || meld_phases[i]){
            // we handle melded methods and phases later
            // we set to null to preserve property order
            destination[i] = null;
            continue;
          }
          // stack the ifs for speed
          if(idea[i].pattern)if(!idea[i].machine)if(!idea[i].skip_auto_build){
            // it's an auto-build property, auto-meld it
            destination[i] = Doh.meld_objects(destination[i], idea[i]);
            // if it's being melded once, meld it always
            destination.meld_objects = Doh.meld_arrays(destination.meld_objects, [i]);
            continue;
          }
          // non-melded property
          if(!skip_methods){
            destination[i] = idea[i];
            continue;
          } else if(typeof idea[i] !== 'function'){
            destination[i] = idea[i];
          }
        }
      }
      
      if(destination.meld_methods){
        i = '';
        for(i in meld_phases){
          // don't allow phases to be in meld_methods
          delete destination.meld_methods[i];
        }
      }

      // this section is only run after the origin idea was inherited
      if(destination.inherited)if(destination.inherited.idea){
        // we update here so it only happens once
        // we only want to run this after the idea has been melded 
        // inherited is only present on instances, patterns don't have it
        // and neither do plain ideas
        if(!skip_methods) Doh.update_meld_methods(destination);
      }

      return destination;
    },
    
    /**
     *  @brief Normallize all the ways we can format inherits
     *
     *  @param [in] destination Object or Prototype to adjust .inherits on
     *  @param [in] inherits    String, Array, Array-like-object, or Object of
     *                          patterns to inherit from. (See details)
     *  @return destination
     *
     *  @details This method modifes 'destination'
     *
     * 'pattern_name_1'
     * ['pattern_name_1', 'pattern_name_2']
     * {0:'pattern_name_1', 1:'pattern_name_2'}
     * {'pattern_name_1':true, 'pattern_name_2':true}
     *
     * *RESULTS IN:* {'pattern_name_1':true, 'pattern_name_2':true}
     * *OR* {}
     **/
    normalize_inherits: function(destination, inherits){
      // allow inherits to be a string
      if (typeof inherits === 'string')
        destination[inherits] = true;
      // or an array-like object
      else if (typeof inherits !== 'undefined'){
        for(var i in inherits){
          if (i !== 'length'){
            // allow the array structure to have the pattern name in key
            if(isNaN(i)) destination[i] = true;
            // or in the value
            else destination[inherits[i]] = true;
          }
        }
      }
      return destination;
    },
    
    pattern_inherits_extended: function(pattern_name_or_inherits){
      return Object.keys(Doh.extend_inherits(Doh.normalize_inherits({}, pattern_name_or_inherits)));
    },
    
    PatternInheritedBy: {},


    /*

                                                                                  
                                                              ,,                  
                    mm     mm                                 db                  
                    MM     MM                                                     
`7MMpdMAo.  ,6"Yb.mmMMmm mmMMmm .gP"Ya `7Mb,od8 `7MMpMMMb.  `7MM  M"""MMV .gP"Ya  
  MM   `Wb 8)   MM  MM     MM  ,M'   Yb  MM' "'   MM    MM    MM  '  AMV ,M'   Yb 
  MM    M8  ,pm9MM  MM     MM  8M""""""  MM       MM    MM    MM    AMV  8M"""""" 
  MM   ,AP 8M   MM  MM     MM  YM.    ,  MM       MM    MM    MM   AMV  ,YM.    , 
  MMbmmd'  `Moo9^Yo.`Mbmo  `Mbmo`Mbmmd'.JMML.   .JMML  JMML..JMML.AMMmmmM `Mbmmd' 
  MM                                                                              
.JMML.                                                                           
                                                                               
    */
    /**
     *  @brief Create a pattern for use in object construction
     *
     *  @param [in] name     a string pattern name
     *  @param [in] inherits a string or array of patterns to inherit from, in order
     *  @param [in] idea     a prototype object
     *  @return the created pattern
     *
     *  @details Additionally sets the value of this.pattern to 'name'.
     *  Can be called as follows:
     *   Pattern(idea);                  *[object] requires the idea to define .pattern
     *   Pattern(name);                  *[string] creates an empty 'object' pattern at Patterns[name]
     *   Pattern(name, idea);            *[string], [object] inherits must be in the idea if needed
     *   Pattern(name, inherits, idea);  *[string], [string/array], [object]
     */
    pattern: function(name, inherits, idea){
      // find the arguments
      if(typeof name !== 'string'){
        // the name is the idea
        // only allow this if the idea contains its own pattern name
        idea = name;
        if(typeof idea.pattern === 'string') name = idea.pattern;
        else throw Doh.Error('Doh.pattern('+idea+') tried to make a pattern with no name');

        // inherits will be in the idea
        inherits = false;
      } else if (typeof inherits !== 'string' && !(inherits instanceof Array)) {
        // inherits is the idea
        idea = inherits;
        // inherits will be in the idea
        inherits = false;
      }
      if(!idea) idea = {};
      // otherwise the arguments are as indicated

      // every pattern must know it's own key on the Patterns object
      idea.pattern = name;
      
      if(Patterns[name]){
        Doh.Warn('(',name,') pattern is being overwritten.\nOriginal Module:',Doh.PatternsByModule[name],'\nNew Module:',Doh.ModuleCurrentlyRunning);
      }

      // normalize passed in inherits
      if(inherits) inherits = Doh.normalize_inherits({}, inherits);
      // normalize the inherits of the pattern idea
      if(idea.inherits) idea.inherits = Doh.normalize_inherits({}, idea.inherits);
      // extend them onto a fresh object
      idea.inherits = Doh.meld_objects({}, inherits || {}, idea.inherits || {});
      // if there still aren't any inherits, at least inherit object
      if(name !== 'object')if(SeeIf.IsEmptyObject(idea.inherits)) idea.inherits.object = true;
      // now that we've normalized all the inherits, report our dependencies to each PatternInheritedBy
      for(var ancestor in idea.inherits){
        Doh.PatternInheritedBy[ancestor] = Doh.PatternInheritedBy[ancestor] || [];
        Doh.PatternInheritedBy[ancestor].push(name);
      }
      // store the new pattern for the builder
      Patterns[name] = idea;
      // note the new pattern's load module, if present
      Doh.PatternsByModule[name] = Doh.ModuleCurrentlyRunning;
      // return the new pattern
      return idea;
    },
    
    // MANDATORY FOR OBJECTS TO BE SINGLETON CLASSES
    Prototype: function(){
      var DohObject = function(){};
      return new DohObject();
    },
    
    /*
                                   
       ,,                    ,,    ,,        ,,  
      *MM                    db  `7MM      `7MM  
       MM                          MM        MM  
       MM,dMMb.`7MM  `7MM  `7MM    MM   ,M""bMM  
       MM    `Mb MM    MM    MM    MM ,AP    MM  
       MM     M8 MM    MM    MM    MM 8MI    MM  
       MM.   ,M9 MM    MM    MM    MM `Mb    MM  
       P^YbmdP'  `Mbod"YML..JMML..JMML.`Wbmd"MML.
                                                 
                                                 
    */
    /**
     *  @brief Build a new Doh Object
     */
    New: function(pattern, idea, phase){
      var i = '';

      // if the pattern is a string,
      if(typeof pattern == 'string'){
        // then everything is normal
        idea = idea || {};
        idea.pattern = pattern;

      // if the pattern is an array,
      } else if(Array.isArray(pattern)){
        // make sure idea is an object
        idea = idea || {};
        // normalize passed-in inherits
        idea.inherits = Doh.normalize_inherits({}, idea.inherits);
        // merge pattern into idea.inherits
        i = '';
        for(i in pattern){
          idea.inherits[pattern[i]] = true;
        }
        idea.pattern = 'idea';
      // pattern is the idea
      } else {
        phase = idea;
        idea = pattern;
      }
      // ensure that the idea object is at least blank
      idea = idea || {};
      phase = phase || 'final';
      // if the idea already has a machine, just run it to the specified or final phase
      if(idea.machine){
        idea.machine(phase);
        return idea;
      }

      // normalize passed-in inherits
      if(idea.inherits) idea.inherits = Doh.normalize_inherits({}, idea.inherits);

      // the builder requires at least one pattern
      if(SeeIf.IsEmptyObject(idea.inherits)){
        if(!Patterns[idea.pattern]) {
          // we could not find at least one pattern
          // default to object
         Doh.Warn('New idea had no inherits OR no pattern was found, default pattern to "object"',idea);
         idea.pattern = 'object';
        }
      }

      // start with a fresh object and the container for recording inheritence
      //var object = new DohObject();
      // start with a fresh object and the container for recording inheritence
      var object = Doh.Prototype();

      object.inherited = object.inherited || {};

      // collect a list of patterns by recursively crawling the pattern .inherits
      var patterns = Doh.extend_inherits(Patterns[idea.pattern].inherits);
      // allow the idea to specify last-second inherits to at the end
      var idea_patterns = Doh.extend_inherits(idea.inherits);
      // add inherited patterns from the idea if missing from patterns
      patterns = Doh.meld_objects(patterns, idea_patterns);

      // add the pattern last
      if(idea.pattern) patterns[idea.pattern] = true;

      // mixin each pattern
      i = '';
      for(i in patterns){
        if(!Patterns[i]){
          Doh.Warn('Doh.New: '+ idea.pattern + 'tried to inherit from "', i, '" but it was not found, skipping it entirely.');
        } 
        Doh.mixin_pattern(object, i);
      }

      // reset the inherits property
      object.inherits = [];

      // make inherits an ordered list of inherited
      i = '';
      for(i in patterns){
        object.inherits.push(i);
      }

      // attach the object machine
      object.machine = function(phase){
        let phase_name, len = this.phases.length;
        // go through the phases to the one specified, or the last
        for(let i = 0; i < len; i++){
          // stash the phase name
          phase_name = this.phases[i];
          // as long as the phase hasn't been run
          if(!this.machine[phase_name]){
            // update the phase we are on
            this.machine.phase = phase_name;
            // mark it as not run
            this.machine[phase_name] = false;
            // run the phase
            this[phase_name].apply(this);
            // mark it as run
            this.machine[phase_name] = true;
          }
          // if this is the phase we are building to, then exit here
          if(phase_name == phase) return this;
        }
        // always return the object. New() relies on this.
        return this;
      };

      // add the idea to the object
      // now that the object has a machine, the phases and meld_methods will be added
      Doh.meld_ideas(object, idea);

      // mark the idea as inherited
      object.inherited.idea = idea;
      
      // update the meld methods to include the inherited idea we just added
      Doh.update_meld_methods(object);

      //fix the idealize method
      object.idealize = Doh.idealize;

      // run the machine to the specified phase and return the object
      return object.machine(phase);
    },

    /*                                                 
      ,,        ,,                     ,,    ,,                  
      db      `7MM                   `7MM    db                  
                MM                     MM                        
    `7MM   ,M""bMM  .gP"Ya   ,6"Yb.    MM  `7MM  M"""MMV .gP"Ya  
      MM ,AP    MM ,M'   Yb 8)   MM    MM    MM  '  AMV ,M'   Yb 
      MM 8MI    MM 8M""""""  ,pm9MM    MM    MM    AMV  8M"""""" 
      MM `Mb    MM YM.    , 8M   MM    MM    MM   AMV  ,YM.    , 
    .JMML.`Wbmd"MML.`Mbmmd' `Moo9^Yo..JMML..JMML.AMMmmmM `Mbmmd' 
                                                                 
                                                             
  */                                                                                                              
                                                                                                                     
    idealize: function(patterns, active) {
      let j, new_idea = {}, which_idea;
      // default to finding the original idea
      patterns = patterns || 'idea';
      // make sure that patterns is an array
      if(!Array.isArray(patterns)) patterns = [patterns];
      // for each filter idea
      for(let i=0; i<patterns.length; i++){
        which_idea = patterns[i];
        j = '';
        // loop over the idea and use it to add properties from the inherited.idea
        for(j in this.inherited[which_idea]){
          // functions should only come from the inherited.idea
          if(typeof this.inherited[which_idea][j] === 'function'){
            if(which_idea === 'idea'){
              new_idea[j] = this.inherited.idea[j];
            }
            continue;
          }
          // if we are getting active values, get them from this
          if(which_idea === 'idea' || j !== 'inherits'){
            if(active){
              new_idea[j] = this[j];
            } else if(this.inherited[which_idea][j] !== undefined) {
              new_idea[j] = this.inherited[which_idea][j];
            }
          }
        }
        // if the idea has a funtion for it's "ideal" state, run it
        if(Patterns[which_idea])
         if(typeof Patterns[which_idea].idealize === 'function'){
            Patterns[which_idea].idealize.call(this, patterns, active, new_idea);
        }
      }
      return new_idea;
    },
    // show me properties/methods/both of a doh object filtered by [patterns]
    perspective: function(obj, patterns, methods = false){
      if(!obj) return false;
      let j, new_idea = {}, which_idea;
      // default to finding the original idea
      patterns = patterns || 'idea';
      // make sure that patterns is an array
      if(!Array.isArray(patterns)) patterns = [patterns];
      // default to expanding the pattern, require it to be shut off
      patterns = Doh.pattern_inherits_extended(patterns);
      // for each filter idea
      for(let i=0; i<patterns.length; i++){
        which_idea = patterns[i];
        j = '';
        // loop over the idea and use it to add properties from the inherited.idea
        for(j in obj.inherited[which_idea]){
          if(!methods){
            if(typeof obj[j] !== 'function'){
              new_idea[j] = obj[j];
            }
          } else {
            if(methods === 'both'){
              new_idea[j] = obj[j];
            } else if(typeof obj[j] === 'function'){
              new_idea[j] = obj[j];
            }
          }
        }
      }
      return new_idea;
    },

    // args.exclude_methods, args.truncate_methods, args.exclude_children
    idea_to_yaml: function(idea, args){
      var ic = this.idea_to_ideacode(idea, args);
      return jsyaml.load(ic);
    },

    idea_to_ideacode: function(idea, args){

      var trailing_comma = '';

      var str = (Array.isArray(idea)? '[':'{');

      for(var i in idea){
        if(i == 'prototype' || i == '__proto__') {continue;}
        if(idea[i] instanceof Doh.jQuery) {continue;}
        if(InstanceOf(idea[i])){ continue;}
        if(args){
          if(args.exclude_methods){if(typeof idea[i] == 'function') continue;}
          if(args.exclude_children){if(i == 'children') continue;}
        }

        str = str + trailing_comma;
        trailing_comma = ',';

        if(!Array.isArray(idea)) str = str + '"' + i + '":';

        switch(typeof idea[i]){
          case 'function':
            if(args)if(args.truncate_methods){
              str = str + 'Function';
              break;
            }
          case 'number':
          case 'boolean': // ANDY added 11.30.19
            str = str + ''+idea[i];
            break;
          case 'object':
          case 'array':
            str = str + Doh.idea_to_ideacode(idea[i]);
            break;
          case 'string':
            if(i == 'children'){
              str = str + ''+idea[i];
              break;
            }
          default:
            str = str + '"' + idea[i] + '"';
            break;
        }
      }

      str = str + (Array.isArray(idea)? ']':'}');

      return str;
    },

    idea_to_pretty_ideacode: function(idea, indent){
      var args = false;
      if(typeof indent == 'object'){
        args = indent;
        indent = args.indent || 1;
      } else indent = indent || 1;
      var indent_type = '  ', indent_str = indent_type.repeat(indent);

      var trailing_comma = '';

      var str = (Array.isArray(idea)? '[\n':'{\n');

      for(var i in idea){
        if(i == 'prototype' || i == '__proto__') {continue;}
        if(idea[i] instanceof Doh.jQuery) {continue;}
        if(InstanceOf(idea[i])){ continue;}
        if(args){
          if(args.exclude_methods){if(typeof idea[i] == 'function') continue;}
          if(args.exclude_children){if(i == 'children') continue;}
        }

        str = str + trailing_comma;
        trailing_comma = ',\n';

        if(!Array.isArray(idea)) str = str + indent_str + i + ':';
        else str = str + indent_str;

        switch(typeof idea[i]){
          case 'function':
            if(args)if(args.truncate_methods){
              str = str + 'Function';
              break;
            }
          case 'number':
            str = str + ''+idea[i];
            break;
          case 'object':
          case 'array':
            str = str + Doh.idea_to_ideacode(idea[i], indent + 1);
            break;
          case 'string':
            if(i == 'children'){
              str = str + ''+idea[i];
              break;
            }
          default:
            str = str + '"' + idea[i] + '"';
            break;
        }
      }

      str = str + indent_type.repeat(indent - 1 || 0) + (Array.isArray(idea)? ']':'}');

      return str;
    },

    ideacode_to_source: function(ideacode){
      return 'New(' + ideacode + ');\n';
    },
    
    meld_method_order: function(object, method){
      var meld_method_order = [], pre_meld_method_order = [];
      for(var i in object.inherited){
        if(object.inherited[i]['pre_'+method]) pre_meld_method_order.push(i+'.pre_'+method);
        if(object.inherited[i][method]) meld_method_order.push(i+'.'+method);
      }
      return pre_meld_method_order.concat(meld_method_order);
    },
    phases_method_order: function(object){
      var phases_method_order = [];
      for(var i in object.phases){
        phases_method_order.push(Doh.meld_method_order(object, object.phases[i]));
      }
      return phases_method_order;
    },
    
    meld_methods_order: function(object){
      var methods_order = [], counter = 0, phase_methods = 0;
      for(let i in object.phases){
        methods_order.push(Doh.meld_method_order(object, object.phases[i]));
        counter += methods_order[methods_order.length-1].length
      }
      phase_methods = counter;
      Doh.log('has:', phase_methods, ' phase methods.');
      for(let i in object.meld_methods){
        methods_order.push(Doh.meld_method_order(object, object.meld_methods[i]));
        counter += methods_order[methods_order.length-1].length
      }
      Doh.log('and:', counter - phase_methods, ' melded methods.');
      return methods_order;
    },
    
    log_melded_method: function(object, method){
      var method_array = Doh.meld_method_order(object, method);
      for (i in method_array){
        Doh.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method].toString());
      }
    },
    link_melded_method: function(object, method){
      var method_array = Doh.meld_method_order(object, method);
      for (i in method_array){
        Doh.log(method_array[i],object.inherited[method_array[i].split('.')[0]][method]);
      }
    }
  });
  /* **** Doh Object Ready **** */
  Patterns = Doh.Patterns;
  Pattern = Doh.pattern;
  New = Doh.New;
  InstanceOf = Doh.InstanceOf = function(object, type){
    type = type || 'object';
    if(object)if(object.inherited)if(object.inherited[type]) return true;
    return false;
  }
  Doh.Error = Doh.error;
  Doh.Warn = Doh.warn;

  Pattern('idea');

  // set the prototype for the object constructor
  Pattern('object', {
    meld_arrays: [
      'meld_arrays',
      'meld_objects',
      'meld_methods',
      'phases',
    ],
    phases: [
      'object_phase',
    ],
    // ensure that we are the base object phase
    object_phase: function() {
      for(var i in this) {
        if(i === 'prototype' || i === '__proto__') continue;
        if(this[i].pattern && !this[i].machine && !this[i].skip_auto_build){
          this[i]._auto_built_by = this;
          this[i] = New(this[i]);
        }
      }
    },
  });

  Pattern('log', 'object', {
    log_type: 'Doh:',
    logger:console,
    logger_method: 'log',
    phases:['log_phase'],
    log_phase: function(){
      var args = [this.log_type];
      for(var i in this.args){
        if(i === 'length') continue;
        args.push(this.args[i]);
      }
      logger[logger_method].apply(logger, args);
    }
  }); // true to skip adding css classes for this object

  Pattern('error', 'log', {
    log_type: 'Doh ERROR:',
    logger_method: 'error',
  }); // true to skip adding css classes for this object

  Pattern('warning', 'log', {
    log_type: 'Doh Warning:',
    logger_method: 'warn',
  });

/*
                                                                                                                                                                   
                                                                              
  ,,          ,,                                           ,,                 
`7MM          db                                         `7MM                 
  MM                                                       MM                 
  MMpMMMb.  `7MM  .gP"Ya `7Mb,od8 ,6"Yb.  `7Mb,od8 ,p6"bo  MMpMMMb.`7M'   `MF'
  MM    MM    MM ,M'   Yb  MM' "'8)   MM    MM' "'6M'  OO  MM    MM  VA   ,V  
  MM    MM    MM 8M""""""  MM     ,pm9MM    MM    8M       MM    MM   VA ,V   
  MM    MM    MM YM.    ,  MM    8M   MM    MM    YM.    , MM    MM    VVV    
.JMML  JMML..JMML.`Mbmmd'.JMML.  `Moo9^Yo..JMML.   YMbmd'.JMML  JMML.  ,V     
                                                                      ,V      
                                                                   OOb"                                                                                                                                                                         
*/


  Pattern('hierarchy', 'object', {
    // parent should be a Doh Object or false
    parent: false,
    // list of child objects to build
    children: [],
    // advance the children machine to this phase when building
    machine_children_to: 'parenting_phase',
    // extend the children array
    meld_arrays: [
      'children'
    ],
    // setup our phases for building children and controls
    phases: [
      'parenting_phase',
    ],
    // create a phase to build children
    parenting_phase: function(){
      // loop through the children and attempt to build them
      var that = this;
      for(var i in this.children) {
        if(i === 'length') continue;
        this.children[i] = New(Doh.meld_objects({parent:this}, this.children[i]), this.machine_children_to);
      }
    },
  });

  //fab_iterator = null;
  Pattern('fab', 'hierarchy', {
    // list of things to fab, key is fab_iterator
    fab: {},
    // base idea used to build each child
    fab_idea: {skip_auto_build:true},
    meld_objects: ['fab', 'fab_idea'],
    // add our own phase
    phases: [
      'fab_phase',
    ],
    object_phase: function(){
      // move our phase to before parenting_phase
      // we need to populate the children ideas prior to building
      Doh.array_move(this.phases, this.phases.indexOf('fab_phase'), this.phases.indexOf('parenting_phase'));
    },
    // create a phase to build children ideas
    fab_phase: function(){
      var fabs={}, j = '';
      // loop through the children and attempt to build them
      for(var i in this.fab) {
        if(i === 'length') continue;
        // our own iteration tracking
        fabs.fab_iterator = i;
        fabs.fab_value = this.fab[i];
        // custom iteration tracking
        for(j in this.fab_iterator_mask){
          fabs[j] = i;
        }
        j = '';
        for(j in this.fab_value_mask){
          fabs[j] = this.fab[i];
        }
        // build the ideas
        this.children.push(Doh.meld_objects({},this.fab_idea,fabs));
      }
    },
  });
});

/**
 * jQuery plugin for adding, removing and making changes to CSS rules
 * 
 * @author Vimal Aravindashan
 * @version 0.3.7
 * @licensed MIT license
 */
(function (factory) {
	if (typeof module === "object" && typeof module.exports === "object") {
		// Node/CommonJS
		module.exports = factory;
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {
	var	_ahref = $(document.createElement('a')), /**< <a> tag used for evaluating hrefs */
		_styles = _ahref.prop('style'), /**< Collection of styles available on the host */
		_sheet = function(s) {
			return s.sheet || s.styleSheet;
		}($('<style type="text/css">*{}</style>').appendTo('head')[0]), /**< StyleSheet for adding new rules*/
		_rules = ('cssRules' in _sheet) ? 'cssRules' : 'rules', /**< Attribute name for rules collection in a stylesheet */
		vendorPrefixes = ["Webkit", "O", "Moz", "ms"]; /**< Case sensitive list of vendor specific prefixes */
	
	/**
	 * @function filterStyleSheet
	 * Filter a stylesheet based on accessibility and, ID or location
	 * @param {String} filter Filter to be applied. id or href of the style element can be used as filters.
	 * @param {CSSStyleSheet} styleSheet StyleSheet to be filtered
	 * @returns {Boolean} true if styleSheet matches the filter, false otherwise
	 */
	function filterStyleSheet(filter, styleSheet) {
		try {
			if(styleSheet[_rules]) {
				filter = filter || '';
				var node = $(styleSheet.ownerNode || styleSheet.owningElement);
				return (filter === '') || (filter === '*') ||
					('#'+(node.prop('id') || '') == filter) ||
					((node.prop('href') || '') == _ahref.prop('href', filter).prop('href'));
			} else {
				return false;
			}
		} catch(e) {
			return false;
		}
	}
	
	/**
	 * @function parseSelector
	 * Splits a jQuery.stylesheet compatible selector into stylesheet filter and selector text
	 * @param {String} selector Selector text to be parsed
	 * @returns {Object} object with two properties 'styleSheet' and 'selectorText'
	 */
	function parseSelector(selector) {
		var styleSheet = (/.*?{/.exec(selector) || ['{'])[0],
			selectorText = /{.*}/g.exec(selector); //TODO: replace selector with dict object
		if(selectorText === null) {
			var parts = selector.split('{');
			selectorText = '{'+parts[parts.length==1 ? 0 : 1].split('}')[0]+'}';
		} else {
			selectorText = selectorText[0];
		}
		return {
			styleSheet: $.trim(styleSheet.substr(0, styleSheet.length-1)),
			selectorText: normalizeSelector(selectorText.substr(1, selectorText.length-2))
		};
	}
	
	/**
	 * @function normalizeSelector
	 * Normalizes selectorText to work cross-browser
	 * @param {String} selectorText selector string to normalize
	 * @returns {String} normalized selector string
	 */
	function normalizeSelector(selectorText) {
		var selector = [], last, len;
		last = _sheet[_rules].length;
		insertRule.call(_sheet, selectorText, ';'); //NOTE: IE doesn't seem to mind ';' as non-empty
		len = _sheet[_rules].length;
		for(var i=len-1; i>=last; i--) {
			selector.push(_sheet[_rules][i].selectorText);
			deleteRule.call(_sheet, i);
		}
		return selector.reverse().join(', ');
	}
	
	/**
	 * @function matchSelector
	 * Matches given selector to selectorText of cssRule
	 * @param {CSSStyleRule} cssRule to match with
	 * @param {String} selectorText selector string to compare
	 * @param {Boolean} matchGroups when true, selector is matched in grouped style rules
	 * @returns true if selectorText of cssRule matches given selector, false otherwise
	 */
	function matchSelector(cssRule, selectorText, matchGroups) {
		if($.type(cssRule.selectorText) !== 'string') {
			return false;
		}
		
		if(cssRule.selectorText === selectorText) {
			return true;
		} else if (matchGroups === true) {
			return $($.map(cssRule.selectorText.split(','), $.trim)).filter(function(i) {
				return this.toString() === selectorText;
			}).length > 0;
		} else {
			return false;
		}
	}
	
	/**
	 * @function vendorPropName
	 * Vendor prefixed style property name.
	 * Based on similar function in jQuery library.
	 * @param {String} name camelCased CSS property name
	 * @returns {String} Vendor specific tag prefixed style name
	 * if found in styles, else passed name as-is
	 * @see vendorPrefixes
	 * @see _styles
	 */
	function vendorPropName(name) {
		var titleName = name[0].toUpperCase() + name.slice(1),
			styleName, i = vendorPrefixes.length;
		while( --i ) {
			styleName = vendorPrefixes[i] + titleName;
			if(styleName in _styles) {
				return styleName;
			}
		}
		return name;
	}
	
	/**
	 * @function normalizeRule
	 * Normalizes the CSSStyleRule object to work better across browsers
	 * @param {CSSStyleRule} rule CSSStyleRule object to be normalized
	 * @param {StyleSheet} styleSheet parent stylesheet of the rule
	 * @returns {CSSStyleRule} normalized CSSStyleRule
	 */
	function normalizeRule(rule, styleSheet) {
		//NOTE: this is experimental, however, it does have it's benefits
		//      for use with $.animate(), be sure to include jquery.stylesheet-animate.js as well
		//TODO: move some of the defaults used here to user options
		rule.ownerDocument = rule.ownerDocument || document; //XXX: Hack for jQuery.isHidden()
		rule.nodeType = rule.nodeType || 1; //XXX: Hack for jQuery's defaultPrefilter()
		rule.nodeName = rule.nodeName || 'DIV'; //XXX: Hack for jQuery's acceptData()
		rule.parentNode = rule.parentNode || styleSheet.ownerNode || styleSheet.owningElement; //XXX: Hack for jQuery.contains()
		rule.parentStyleSheet = rule.parentStyleSheet || styleSheet; //XXX: Fix for IE7
		return rule;
	}
	/*
	 * Checking for 'instanceof CSSStyleRule' fails in IE7 but not in IE8, however, the call to normalizeRule() fails in both.
	 * So, we will define our custom CSSStyleRule class on all browsers where normalizeRule() fails.
	 */
	try {
		normalizeRule(_sheet[_rules][0], _sheet);
		$.support.nativeCSSStyleRule = true;
	} catch(e) {
		$.support.nativeCSSStyleRule = false;
		CSSStyleRule = function(rule) {
			$.extend(this, rule);
			this.rule = rule; //XXX: deleteRule() requires the original object
			this.currentStyle = rule.style; //XXX: Hack for jQuery's curCSS()/getStyles() for IE7
		};
	}
	
	/**
	 * @function insertRule
	 * Cross-browser function for inserting rules
	 * @param {String} selector selectorText for the rule
	 * @param {String} css CSS property-value pair string
	 * @param {Number} index Index position to insert the string;
	 * defaults to end of rules collection
	 */
	function insertRule(selector, css, index) {
		if(!selector || !css) {
			return -1; //NOTE: IE does not like addRule(selector,'',index)
		}
		var self = this,
			_insfn = self.insertRule ? function (selector, css, index) { this.insertRule(selector+'{'+css+'}', index); } : self.addRule;
		index = index || this[_rules].length;
		try {
			return _insfn.call(self, selector, css, index);
		} catch(e) {
			$.each(selector.split(','), function(i, sel) {
				_insfn.call(self, $.trim(sel), css);
			});
			return -1;
		}
	}
	
	/**
	 * @function deleteRule
	 * Cross-browser function for deleting rules
	 * @param {Number|CSSStyleRule} Index of rule to be deleted, or
	 * reference to rule to be deleted from rules collection
	 */
	function deleteRule(rule) {
		//NOTE: If we are using our custom CSSStyleRule, then CSSStyleRule.rule is the real style rule object
		rule = (rule && rule.rule) ? rule.rule : rule;
		if(!rule) {
			return;
		}
		var self = this,
			_delfn = self.deleteRule || self.removeRule;
		if(!_delfn) { //NOTE: IE7 has issues with rule.parentStyleSheet, so we need to search for the parent stylesheet
			$(document.styleSheets).each(function (i, styleSheet) {
				if($(styleSheet[_rules]).filter(function() {return this === rule;}).length == 1) {
					self = styleSheet;
					_delfn = self.deleteRule || self.removeRule;
					return false;
				}
			});
		}
		if($.type(rule) == 'number') {
			_delfn.call(self, rule);
		} else {
			$.each(self[_rules], function (i, _rule) {
				if(rule === _rule) {
					_delfn.call(self, i);
					return false;
				}
			});
		}
	}
	
	/**
	 * jQuery.stylesheet
	 * 
	 * Constructor/Factory method for initializing a jQuery.stylesheet object.
	 * Includes a short-cut to apply style changes immediately.
	 * @param {String} selector CSS rule selector text with optional stylesheet filter  
	 * @param {String|Array|Object} name Name of style property to get/set.
	 * Also accepts array of property names and object of name/value pairs.
	 * @param {String} value If defined, then value of the style property
	 * is updated with it. Unused when name is an object map.
	 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
	 * if name/value is not passed, or value of property or object of name/value pairs
	 */
	$.stylesheet = function (selector, name, value) {
		if(!(this instanceof $.stylesheet)) {
			return new $.stylesheet(selector, name, value);
		}
		
		this.init(selector);
		return this.css(name, value);
	};
	
	$.extend($.stylesheet, {
		/**
		 * @function jQuery.stylesheet.cssRules
		 * @param {String} selector CSS rule selector text with optional stylesheet filter
		 * @returns {Array} Array of CSSStyleRule objects that match the selector text
		 * and pass the stylesheet filter
		 */
		cssRules: function (selector) {
			var rules = [],
				filters = parseSelector(selector);
			//NOTE: The stylesheet filter will be treated as case-sensitive
			//      The selectorText filter's case depends on the browser
			$(document.styleSheets).each(function (i, styleSheet) {
				if(filterStyleSheet(filters.styleSheet, styleSheet)) {
					$.merge(rules, $(styleSheet[_rules]).filter(function() {
						return matchSelector(this, filters.selectorText, filters.styleSheet === '*');
					}).map(function() {
						return normalizeRule($.support.nativeCSSStyleRule ? this : new CSSStyleRule(this), styleSheet);
					}));
				}
			});
			return rules.reverse();
		},
		
		/**
		 * @function jQuery.stylesheet.camelCase
		 * jQuery.camelCase is undocumented and could be removed at any point
		 * @param {String} str Hypenated string to be camelCased
		 * @returns {String} camelCased string
		 */
		camelCase: $.camelCase || function( str ) {
			return str.replace(/-([\da-z])/g, function(a){return a.toUpperCase().replace('-','');});
		},
		
		/**
		 * Normalized CSS property names
		 * jQuery.cssProps is undocumented and could be removed at any point
		 */
		cssProps: $.cssProps || {},
		
		/**
		 * @function jQuery.styesheet.cssStyleName
		 * @param {String} name Hypenated CSS property name
		 * @returns {String} camelCased or vendor specific name if found in host styles
		 */
		cssStyleName: function (name) {
			if(name) {
				var camelcasedName = $.camelCase(name);
				if(camelcasedName in _styles) {
					return camelcasedName;
				} else if (($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelcasedName))) in _styles) {
					return $.cssProps[name];
				}
			}
		}
	});
	
	$.stylesheet.fn = $.stylesheet.prototype = {
		/**
		 * @function jQuery.stylesheet.fn.init
		 * Initializes a jQuery.stylesheet object.
		 * Selects a list of applicable CSS rules for given selector.
		 * @see jQuery.stylesheet.cssRules
		 * @param {String|Array|Object} selector CSS rule selector text(s)
		 * with optional stylesheet filter(s)
		 */
		init: function (selector) {
			var rules = []; /**< Array of CSSStyleRule objects matching the selector initialized with */
			
			switch($.type(selector)) {
			case 'string':
				rules = $.stylesheet.cssRules(selector);
				break;
			case 'array':
				$.each(selector, function (idx, val) {
					if($.type(val) === 'string') {
						$.merge(rules, $.stylesheet.cssRules(val));
					} else if(val instanceof CSSStyleRule) {
						rules.push(val);
					}
				});
				break;
			case 'object':
				if(selector instanceof CSSStyleRule) {
					rules.push(val);
				}
				break;
			}
			
			$.extend(this, {
				/**
				 * @function jQuery.stylesheet.rules
				 * @returns {Array} Copy of array of CSSStyleRule objects used
				 * by this instance of jQuery.stylesheet 
				 */
				rules: function() {
					return rules.slice();
				},
				
				/**
				 * @function jQuery.stylesheet.css()
				 * @param {String|Array|Object} name Name of style property to get/set.
				 * Also accepts array of property names and object of name/value pairs.
				 * @param {String} value If defined, then value of the style property
				 * is updated with it. Unused when name is an object map.
				 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
				 * if name/value is not passed, or value of property or object of name/value pairs
				 */
				css: function (name, value) {
					var self = this, styles = undefined;
					
					switch($.type(name)) {
					case 'null':
						$.each(rules, function (idx, rule) {
							deleteRule.call(rule.parentStyleSheet, rule);
						});
						//NOTE: Safari seems to replace the rules collection object on insert/delete
						//      Refresh our private collection to reflect the changes
						rules = $.stylesheet.cssRules(selector);
						return self;
					case 'string':
						var stylename = $.stylesheet.cssStyleName(name);
						if(stylename) {
							if(rules.length === 0 && value !== undefined) {
								var filters = parseSelector(selector),
									sheet = $(document.styleSheets).filter(function () {
										return filterStyleSheet(filters.styleSheet, this);
									});
								sheet = (sheet && sheet.length == 1) ? sheet[0] : _sheet;
								insertRule.call(sheet, filters.selectorText, name+':'+value+';');
								//NOTE: See above note on Safari
								//      Also, IE has different behaviour for grouped selectors 
								rules = $.stylesheet.cssRules(selector);
								styles = self;
							} else {
								$.each(rules, function (i, rule) {
									if(rule.style[stylename] !== '') {
										if(value !== undefined) {
											rule.style[stylename] = value;
											styles = self;
										} else {
											styles = rule.style[stylename];
										}
										return false;
									}
								});
								if(styles === undefined && value !== undefined) {
									rules[0].style[stylename] = value;
									styles = self;
								}
							}
						}
						break;
					case 'array':
						styles = {};
						$.each(name, function (idx, key) {
							styles[key] = self.css(key, value);
						});
						if(value !== undefined) {
							styles = self;
						}
						break;
					case 'object':
						$.each(name, function (key, val) {
							self.css(key, val);
						});
						return self;
					default: /*undefined*/
						return self;
					}
					
					return styles;
				}
			});
		}
	};
}));

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

      Doh.WindowSizes = DWS = Doh.win = {w:jWin.width(), h: jWin.height()};
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
    if(SeeIf.NotEmptyObject(newPattern.css) || SeeIf.HasValue(newPattern.style)){
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

OnLoad('/doh_js/element', function($){

  Pattern('element', 'html');

});

OnLoad('/doh_js/patterns', function($){



});
