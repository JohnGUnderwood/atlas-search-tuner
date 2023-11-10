import { Combobox, ComboboxGroup, ComboboxOption } from '@leafygreen-ui/combobox';
import { Subtitle, Label } from '@leafygreen-ui/typography';


function SelectFieldWeights({fields,weights,setWeights}){

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
      const defaultWeights = {
        autocomplete:0,
        text:0,
        stringFacet:10,
        dateFacet:'1900,2000,2100',
        numberFacet:'0,10,100,1000'
      }
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
                newWeights[ftype][fname] = defaultWeights[ftype];
              }else{
                newWeights[ftype] = {};
                newWeights[ftype][fname] = defaultWeights[ftype];
              }
            }
          }else{
            if(ftype in newWeights){
              newWeights[ftype][fname] = defaultWeights[ftype];
            }else{
              newWeights[ftype] = {};
              newWeights[ftype][fname] = defaultWeights[ftype];
            }
          }
  
        });
        console.log(newWeights);
        setWeights(newWeights);
      }else{
        setWeights(newWeights);
      }
    };

    return (
    <>
        <div style={{width:"80%"}}>
            <Combobox label="Choose Fields to Weight" size="small" multiselect={true} onChange={handleFieldToggle}>
                {Object.keys(fields).filter(fieldType => fieldType=='facet').map(fieldType => (
                  <ComboboxGroup key={fieldType} label={fieldType}>
                    {fields[fieldType].map(field => (
                      <ComboboxOption key={`${field.type.toLowerCase()}Facet_${field.path}`} value={`${field.type.toLowerCase()}Facet_${field.path}`} displayName={field.path}/>
                    ))}
                  </ComboboxGroup>
                ))}
                {Object.keys(fields).filter(fieldType => fieldType!='facet').map(fieldType => (
                  <ComboboxGroup key={fieldType} label={fieldType}>
                    {fields[fieldType].map(field => (
                      <ComboboxOption key={fieldType+'_'+field.path} value={fieldType+'_'+field.path} displayName={field.path}/>
                    ))}
                  </ComboboxGroup>
                ))}
            </Combobox>
        </div>
        <div style={{paddingTop:"2%"}}>
            {Object.keys(weights).filter(type => type=="numberFacet").map(type => (
              <div key={type}>
              <Subtitle key={type+"_st"}>{type} fields</Subtitle>
                {Object.keys(weights[type]).map(field => (
                  <div key={type+'_'+field}>
                  <Label>
                      {`${field} boundaries`}
                      <input
                        style={{verticalAlign:"bottom"}}
                        key={type+'_'+field+'_box'}
                        type="text"
                        value={weights[type][field] || [0,100]} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                      />
                  </Label>
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(weights).filter(type => type=="stringFacet").map(type => (
              <div key={type}>
              <Subtitle key={type+"_st"}>{type} fields</Subtitle>
                {Object.keys(weights[type]).map(field => (
                  <div key={type+'_'+field}>
                  <Label>
                      {`${field} num buckets`}
                      <input
                        style={{verticalAlign:"bottom"}}
                        key={type+'_'+field+'_box'}
                        type="text"
                        value={weights[type][field] || 10} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                      />
                  </Label>
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(weights).filter(type => type=="dateFacet").map(type => (
                <div key={type}>
                <Subtitle key={type+"_st"}>{type} fields</Subtitle>
                {Object.keys(weights[type]).map(field => (
                  <div key={type+'_'+field}>
                  <Label>
                      {`${field} boundaries`}
                      <input
                        style={{verticalAlign:"bottom"}}
                        key={type+'_'+field+'_box'}
                        type="text"
                        value={weights[type][field] || [1970,2023]} 
                        onChange={(e) => handleSliderChange([type,field], e.target.value)}
                      />
                  </Label>
                  </div>
                ))}
                </div>
            ))}
            {Object.keys(weights).filter(type => ['text','autocomplete'].includes(type)).map(type => (
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