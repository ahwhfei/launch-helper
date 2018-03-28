var Queue = (function q() {
    var head, tail;
    function constructor() {
        head = null;
        tail = null;
        this.length = 0;
    }

    constructor.prototype = {
        queue: function (newItem) {
            tail = (tail !== null) ? tail.next = { item: newItem } : head = { item: newItem };
            this.length++;
        },
        dequeue: function () {
            var x = (head !== null) ? head.item : null;
            if (head === tail)
                head = tail = null;
            else
                head = head.next;
            this.length--;
            return x;
        },
        peek: function () {
            return (head !== null) ? head.item : null;
        },
        clear: function () {
            head = null;
            tail = null;
            this.length = 0;
        }
    };

    return constructor;
})();