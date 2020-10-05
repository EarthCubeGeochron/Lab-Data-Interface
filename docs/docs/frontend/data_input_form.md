### Data input form

The data input form is for submitting individual data to the database.

It has three components. The interactive map is for locating the sample and get its geographic coordinates. Once clicked, a marker will be added to the map, and fields for latitude and longitude will be automatically filled. Multiple markers can be added to the form, but the coordinates for the last marker will be filled into corresponding fields. The user can also directly fill latitudes and longitudes into corresponding fields without using the map.

The second component is the form. Fields for latitude, longitude and dates are required. Other fields with blue borders are important fields. For numerical fields, if an input value is out of the recommended range (potential invalid data inputs), the border of that field turns red, otherwise it turns green. 

![agefield](pathname:///images/sample-submit-form/age-field.png)


![geofield](pathname:///images/sample-submit-form/geo-field.png)

The third component is the validation and submission part. The submission button is inactive until all required fields are filled. Texts above the button indicates the number of unfilled and invalid fields. There is also a json-styled data preview in this section.