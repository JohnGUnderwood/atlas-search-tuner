import { useState, useEffect } from 'react';
import { Combobox, ComboboxGroup, ComboboxOption } from '@leafygreen-ui/combobox';
import { Subtitle, Label } from '@leafygreen-ui/typography';


function SelectFieldWeights({fields,weights,setWeights}){

    // const [fields, setFields] = useState(inputFields);
    // const [weights, setWeights] = useState(inputWeights);

    // useEffect(() => {
    //     setFields(thisFields);
    // });

    const handleSliderChange = (weight, newValue) => {
        const [type,field] = weight;
        var typeWeights = weights[type];
        typeWeights[field] = newValue
        setWeights(weights => ({
          ...weights,
          [type]: typeWeights
        }));
      };
    
      const handleFieldToggle = (value) => {
        const fields = value;
        var newWeights = {};
        if (fields.length >0){
          fields.forEach((field) => {
            const ftype = field.split('_')[0];
            // Fieldname might have '_' in it
            const fname = field.split('_').slice(1).join('_');
            if(weights[ftype]){
              if(weights[ftype][fname]){
                if(ftype in newWeights){
                  newWeights[ftype][fname] = weights[ftype][fname];
                }else{
                  newWeights[ftype] = {};
                  newWeights[ftype][fname] = weights[ftype][fname];
                }
              }else{
                if(ftype in newWeights){
                  newWeights[ftype][fname] = 0;
                }else{
                  newWeights[ftype] = {};
                  newWeights[ftype][fname] = 0;
                }
              }
            }else{
              if(ftype in newWeights){
                newWeights[ftype][fname] = 0;
              }else{
                newWeights[ftype] = {};
                newWeights[ftype][fname] = 0;
              }
            }
    
          });
          setWeights(newWeights);
        }else{
          setWeights(newWeights);
        }
      };

    return (
    <>
        <div style={{width:"80%"}}>
            <Combobox label="Choose Fields to Weight" size="small" multiselect={true} onChange={handleFieldToggle}>
                {Object.keys(fields).map(fieldType => (
                <ComboboxGroup key={fieldType} label={fieldType}>
                    {fields[fieldType].map(field => (
                    <ComboboxOption key={fieldType+'_'+field} value={fieldType+'_'+field} displayName={field}/>
                    ))}
                </ComboboxGroup>
                ))}
            </Combobox>
        </div>
        <div style={{paddingTop:"2%"}}>
            {Object.keys(weights).map(type => (
                <div key={type}>
                <Subtitle>{type} fields</Subtitle>
                {Object.keys(weights[type]).map(field => (
                    <div key={type+'_'+field}>
                    <Label>
                        {field}
                        <input
                        key={type+'_'+field+'_slider'}
                        style={{verticalAlign:"bottom"}}
                        type="range"
                        min="-10"
                        max="10"
                        value={weights[type][field] || 0} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                        />
                        <input
                        key={type+'_'+field+'_box'}
                        style={{width:"2lvh"}}
                        type="text"
                        value={weights[type][field] || 0} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                        />
                    </Label>
                    </div>
                ))}
                </div>
            ))}
        </div>
    </>
    )
}

export default SelectFieldWeights