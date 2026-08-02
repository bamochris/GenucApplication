package cd.genuc.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ForwardController {

    @GetMapping(value = "{path:[^\\.]*}")
    public String redirect() {
        // Redirige toutes les routes virtuelles de React (sans point/extension) vers index.html
        return "forward:/index.html";
    }
}