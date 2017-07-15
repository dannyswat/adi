# adi
It is a tiny ui framework that use a json schema to create the ui components and validate data.

## Get Started
HTML Markup
```html
<div id="container"></div>
<button onclick="submit()">Submit</button>
```
It uses jQuery
```html
<script type="text/javascript" src="https://code.jquery.com/jquery-2.2.0.min.js"></script>
<script type="text/javascript" src="adi.js"></script>
```

Initialize the library and create the UI with data definition
```html
<script type="text/javascript">
    
    var $adi = new AdvancedDataInput(); // Initialize
    
    // Add custom ui components or validations here
        
    // JSON schema
    var dataDefinition = [
            {name: 'Name', caption: 'Name', type:'string', options: { required: true }},
            {name: 'Nature', caption: 'Nature', type: 'optional', options: { 
                options: [
                    {text:'School', value:'School', definition: { type: 'group', name: 'SchoolDetail', caption: 'Detail', items: [
                        {name: 'Class', caption: 'Class', type: 'string'},
                        {name: 'Student', caption: 'Students', type: 'array', items: [
                        {name: 'Name', caption: 'Your name', type: 'string'},
                        {name: 'JobTitle', caption: 'Duties', type: 'string'}] }
                    ] }},
                    {text:'Work', value:'Work', definition: { type: 'array', name: 'WorkDetail', caption: 'Detail', items: [
                        {name: 'Department', caption: 'Department', type: 'string'},
                        {name: 'Staff', caption: 'Staff', type: 'array', items: [
                        {name: 'Name', caption: 'Your name', type: 'string', options: { required: true }},
                        {name: 'JobTitle', caption: 'Your job', type: 'date'}] }
                    ] }}
                ]
            }}
            
        ];
        
    var data = null;
        
    $adi.Render($('#container'), dataDefinition, data, 'c');
</script>
```
## Built-in Data Types
