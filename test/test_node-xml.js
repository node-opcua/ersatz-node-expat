/*global require,describe, it*/
var sinon = require("sinon");
var should = require("should");

var expat;
try {
    expat = require('node-expat');
}
catch(err) {

}
var ersatz = require("../lib");
var should = require("should");


var fs = require("fs");


describe("compare node-expat  and erstatz-node-expat", function () {


    function perform_test(namespace, xml_string) {

        var parser = new namespace.Parser('UTF-8');

        var infos = [];

        parser.on('startElement', function (name, attrs) {
            infos.push(['startElement', name, attrs]);
        });

        parser.on('endElement', function (name) {
            infos.push(['endElement', name]);
        });

        parser.on('text', function (text) {
            text = text.split("\n").join("").trim();
            if (text.length > 0) {
                infos.push(['text', text]);
            }
        });

        parser.on('error', function (error) {
            infos.push(['error', error]);
        });

        parser.write(xml_string);
        parser.end();

        return infos;
    }

    if (expat) {
        it("node-expat", function () {
            var xml_string = require("fs").readFileSync(__dirname + "/demo.xml");
            var infos_expat  = perform_test(expat, xml_string);
            var infos_ersatz = perform_test(ersatz, xml_string);

            console.log("infos_expat",infos_expat);
            console.log("infos_expat",infos_ersatz);

            infos_ersatz.should.eql(infos_expat);

        });
    }

    it("should handle a  xml file with encoded string in text", function (done) {
        var xmlfile = __dirname + "/issue.xml";
        var xml_string = require("fs").readFileSync(xmlfile);
        var infos1 = perform_test(ersatz, xml_string);
        infos1[1][1].should.eql("<Hello World>");
        done();

    });

    function performTestAsync(namespace, xmlfile, callback) {

        var map = {};

        function record(name) {
            if (map[name]) {
                map[name] += 1;
            } else {
                map[name] = 1;
            }
        }

        var parser = new namespace.Parser();
        parser.on('startElement', function (name, attrs) {
            record(name);
        });
        parser.on('endElement', function (name) {
        });
        parser.on('text', function (text) {
        });
        parser.on("close", function () {
            callback(map);
        });
        var fs = require('fs');
        var bomstrip = require('bomstrip');
        fs.createReadStream(xmlfile, "utf8").pipe(new bomstrip()).pipe(parser);
    }


    it("should handle a small xml file", function (done) {
        var xmlfile = __dirname + "/demo.xml";
        performTestAsync(ersatz, xmlfile, function (map) {
            Object.keys(map).length.should.be.greaterThan(2);
            done();
        });

    });


    it("should handle a utf8 xml file with a BOM", function (done) {
        // http://stackoverflow.com/questions/6302544/default-encoding-for-xml-is-utf-8-or-utf-16
        var xmlfile = __dirname + "/utf8-with_bom_example.xml";
        performTestAsync(ersatz, xmlfile, function (map) {
            Object.keys(map).length.should.be.greaterThan(2);
            done();
        });

    });

    it("should read a document sent by chunks",function() {


        var spy_startElement = sinon.spy();
        var spy_endElement = sinon.spy();
        var spy_text       = sinon.spy();
        var spy_error      = sinon.spy();
        var spy_close      = sinon.spy();

        var parser = new ersatz.Parser('UTF-8');

        parser.on('startElement', spy_startElement);
        parser.on('endElement', spy_endElement);
        parser.on('text', spy_text);
        parser.on('error', spy_error);
        parser.on('close', spy_close);

        parser.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
        parser.write("<ELEMENTS/>");
        parser.write("<ELE");
        parser.write("MENT>");
        parser.write("Hel");
        parser.write("lo\nWo");
        parser.write("rld<");
        parser.write("/EL");
        parser.write("EMENT>");
        parser.end();

        spy_error.callCount.should.eql(0);
        spy_close.callCount.should.eql(1);

        spy_startElement.callCount.should.eql(2);
        spy_startElement.getCall(1).args[0].should.eql("ELEMENT");

        spy_endElement.callCount.should.eql(2);
        spy_endElement.getCall(1).args[0].should.eql("ELEMENT");
        spy_text.callCount.should.eql(3);
        spy_text.getCall(0).args[0].should.eql("");
        spy_text.getCall(1).args[0].should.eql("Hello");
        spy_text.getCall(2).args[0].should.eql("World");



    });

});
