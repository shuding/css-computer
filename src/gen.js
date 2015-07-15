(function (window, undefined) {

    function Variable() {
        this.name = '';
    }

    Variable.prototype.set = function (name) {
        this.name = name;
    };

    Variable.prototype.output = function (bit) {
        return '<i class="cc cc-' + (+bit) + '-' + this.name + '"></i>';
    };

    function Expression() {
        this.type  = '';
        this.left  = null;
        this.right = null;
    }

    Expression.prototype.parse = function (str, l, r) {
        while (l < r && str[l] == ' ') {
            ++l;
        }
        while (l < r && str[r - 1] == ' ') {
            --r;
        }

        if (l >= r) {
            return null;
        }

        var level    = 0;
        var pos      = -1;
        var priority = 0;

        for (var i = l; i < r; ++i) {
            switch (str[i]) {
                case '(':
                    ++level;
                    break;
                case ')':
                    --level;
                    break;
                case '&':
                    if (level == 0 && priority < 3) {
                        priority = 3;
                        pos      = i;
                    }
                    break;
                case '|':
                    if (level == 0 && priority < 2) {
                        priority = 2;
                        pos      = i;
                    }
                    break;
                case '~':
                    if (level == 0 && priority < 4) {
                        priority = 4;
                        pos      = i;
                    }
                    break;
                case '^':
                    if (level == 0 && priority < 1) {
                        priority = 1;
                        pos      = i;
                    }
                    break;
            }
        }

        if (pos == -1 && str[l] == '(' && str[r - 1] == ')') {
            this.parse(str, l + 1, r - 1);
        } else if (pos == -1) {
            this.type  = 'var';
            this.right = str.substr(l, r - l).trim();
        } else {
            this.type  = str.substr(pos, 1);
            this.left  = new Expression();
            this.left.parse(str, l, pos);
            this.right = new Expression();
            this.right.parse(str, pos + 1, r);
        }
    };

    Expression.prototype.output = function (varibales, map, bit) {
        switch (this.type) {
            case 'var':
                if (map[this.right]) {
                    return map[this.right].output(varibales, map, bit);
                } else if (varibales[this.right]) {
                    return varibales[this.right].output(bit);
                }
                return '';
            case '&':
                if (bit) {
                    return '<i class="cc-and">' + this.left.output(varibales, map, bit) + this.right.output(varibales, map, bit) + '</i>';
                } else {
                    return '<i class="cc-or">' + this.left.output(varibales, map, bit) + this.right.output(varibales, map, bit) + '</i>';
                }
            case '|':
                if (bit) {
                    return '<i class="cc-or">' + this.left.output(varibales, map, bit) + this.right.output(varibales, map, bit) + '</i>';
                } else {
                    return '<i class="cc-and">' + this.left.output(varibales, map, bit) + this.right.output(varibales, map, bit) + '</i>';
                }
            case '~':
                return this.right.output(varibales, map, !bit);
            case '^':
                if (bit) {
                    return '<i class="cc-and"><i class="cc-or">' + this.left.output(varibales, map, bit) + this.right.output(varibales, map, bit) +
                           '</i><i class="cc-or">' + this.left.output(varibales, map, !bit) + this.right.output(varibales, map, !bit) + '</i></i>';
                } else {
                    return '<i class="cc-or"><i class="cc-and">' + this.left.output(varibales, map, bit) + this.right.output(varibales, map, bit) +
                           '</i><i class="cc-and">' + this.left.output(varibales, map, !bit) + this.right.output(varibales, map, !bit) + '</i></i>';
                }
            default :
                return '';
        }
    };

    function Scope() {
        this.variables = {};
        this.map       = {};
    }

    Scope.prototype.genCSS = function () {
        var CSS0 = '', CSS1 = '';
        for (var i in this.variables) {
            if (CSS0) {
                CSS0 += ',';
            }
            CSS0 += '#cc-input-' + i + ':not(:checked)~.cc-container .cc.cc-1-' + i;
            CSS0 += ', #cc-input-' + i + ':checked~.cc-container .cc.cc-0-' + i;
            if (CSS1) {
                CSS1 += ',';
            }
            CSS1 += '#cc-input-' + i + ':not(:checked)~.cc-container .cc.cc-0-' + i;
            CSS1 += ', #cc-input-' + i + ':checked~.cc-container .cc.cc-1-' + i;
        }
        CSS0 += '{width:0}';
        CSS1 += '{width:10px}';
        return CSS0 + CSS1;
    };

    Scope.prototype.genHTML = function () {

    };

    Scope.prototype.addVariable = function (name) {
        this.variables[name] = new Variable();
        this.variables[name].set(name);
    };

    Scope.prototype.addMap = function (name, str) {
        this.map[name] = new Expression();
        this.map[name].parse(str, 0, str.length);
    };

    function Parser(scope) {
        this.scope = scope;
    }

    Parser.prototype.parseLine = function (str) {
        var self       = this;
        var expression = str.toLowerCase().trim();

        var testDeclaration = expression.match(/^var (.+);$/);
        if (testDeclaration !== null) {
            // Declaration variables
            var variables = testDeclaration[1].split(',');
            variables.forEach(function (variable) {
                self.scope.addVariable(variable.trim());
            });
        } else {
            // Expression
            var assignment = expression.match(/^(.+)=(.+);$/);
            self.scope.addMap(assignment[1], assignment[2]);
        }
    };

    window.cc = {
        Variable:   Variable,
        Expression: Expression,
        Scope:      Scope,
        Parser:     Parser
    };
})(window);
