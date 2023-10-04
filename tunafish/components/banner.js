import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import { TextInput } from "@leafygreen-ui/text-input";
import { H1 } from "@leafygreen-ui/typography";
import Button from "@leafygreen-ui/button";

function AppBanner({heading,children}){

    return(
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: "10px"
        }}>
            <div style={{marginRight:"auto"}}>
                <H1><MongoDBLogoMark/>{heading}</H1>
            </div>
            <div style={{marginLeft:"auto", paddingRight:"50px", width:"75%"}}>
                {children}
            </div>
        </div>
    )
}

export default AppBanner;