const path = require('path');

const expect = require('chai').expect;

const {
  parseAttribute,
  parseComponentTags,
  parseComponent
} = require('../src/component-parser.js');

describe('parseAttribute()', () => {
  it('should turn string attributes into object', () => {
    expect(parseAttribute('inlined bundle="app.js"')).to.eql({
      inlined: true,
      bundle: 'app.js'
    });
  });

  it('should allow inlined=false in attribute', () => {
    expect(parseAttribute('inlined=false')).to.eql({
      inlined: 'false'
    });
  });

  it('should handle custom attributes as well', () => {
    expect(
      parseAttribute(
        `rel="preload" 
        as="style" 
        onload="this.rel=\"stylesheet\";this.onload=null"`
      )
    ).to.eql({
      rel: 'preload',
      as: 'style',
      onload: 'this.rel="stylesheet";this.onload=null'
    });
  });
});

describe('parseComponentTags()', () => {
  // eslint-disable-next-line max-len
  it('should parse Abell Component Tag to Component Object before execution', () => {
    const code = `
    var Nav = require('./components/Nav.abell');
    <div>
      <Nav 
        props={
          foo: 'bar'
        }
      />
      <NotComponent/>
    </div>
    `;

    expect(
      parseComponentTags(code)
        .trim()
        .replace(/\s|\n|\r/g, '')
    ).to.equal(
      `
      var Nav = require('./components/Nav.abell');
      <div>{{ Nav({foo: 'bar'}).renderedHTML }} <NotComponent/></div>
      `
        .trim()
        .replace(/\s|\n|\r/g, '')
    );
  });
});

describe('parseComponent()', () => {
  it('should parse component and return a componentTree - Sample.abell', () => {
    const componentTree = parseComponent(
      path.join(__dirname, 'resources', 'Sample.abell'),
      {
        foo: '123TEST'
      },
      { filename: 'component-parser.spec.js' }
    );

    expect(componentTree.renderedHTML.trim().replace(/\n|\r|\s/g, '')).to.equal(
      '<div>Component to test abell. 123TEST</div>'
        .trim()
        .replace(/\n|\r|\s/g, '')
    );

    expect(componentTree.styles[0].content).to.exist.and.include('div');
    expect(componentTree.styles[0]).to.have.keys(
      'component',
      'attributes',
      'componentPath',
      'content'
    );

    expect(componentTree.scripts[0].content).to.exist.and.include(
      'console.log(3)'
    );

    expect(componentTree.scripts[0]).to.have.keys(
      'component',
      'attributes',
      'componentPath',
      'content'
    );
  });

  it('should work for nested components - Parent.abell', () => {
    const componentTree = parseComponent(
      path.join(__dirname, 'resources', 'Parent.abell'),
      {
        filename: 'component-parser.spec.js',
        basePath: path.join(__dirname, 'resources')
      }
    );

    expect(componentTree.renderedHTML.trim().replace(/\n|\r|\s/g, '')).to.equal(
      '<div><div>Component to test abell. Woop Woop!</div></div>'
        .trim()
        .replace(/\n|\r|\s/g, '')
    );

    expect(componentTree.components[0].styles[0].content).to.exist.and.include(
      'div'
    );
    expect(componentTree.components[0].styles[0]).to.have.keys(
      'component',
      'attributes',
      'componentPath',
      'content'
    );

    expect(componentTree.styles.length).to.equal(0);
    expect(componentTree.scripts.length).to.equal(0);
  });
});