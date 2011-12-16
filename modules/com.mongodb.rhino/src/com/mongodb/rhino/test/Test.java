/**
 * Copyright 2010-2011 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */
package com.mongodb.rhino.test;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.Scriptable;

/**
 * Test BSON and JSON conversion.
 * 
 * @author Tal Liron
 */
public class Test
{
	//
	// Main
	//

	public static void main( String[] arguments )
	{
		String array = "[1, 2, 3, {name:'MyChild'}, {$oid:'47cc67093475061e3d95369d'}, new Date(), {$ref: 'test', $id: '4d5595e3f7f2d14d2ab9630f'}, {$regex: 'myreg'}]";
		String object = "{name:'MyObject', children:" + array + ", id:{$oid:'47cc67093475061e3d95369d'}, more:{more:{more:'test'}}, regular:/[w.]+/gi}";
		toJSON( array );
		toJSON( object );
		fromJSON( object, ".children[3].name" );
		fromJSON( object, ".children[5].toString()" );
		toFromJSON( object );
		toBSON( array, "get(4).getClass()" );
		toBSON( array, "get(5).getClass()" );
		toBSON( array, "get(6)" );
		toBSON( object, "get('children').getClass()" );
		toBSON( object, "get('regular')" );
		run( base + "x={name: {$regex: 'pattern'}};System.out.println(BSON.to(x));" );
		run( base + "x=JSON.from('[1,2,3]');x.push(4);System.out.println(x[3]);" );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static final String base = "importClass(java.lang.System, com.mongodb.rhino.BSON);JSON = com.mongodb.rhino.JSON;";

	private static void toJSON( String object )
	{
		run( base + "System.out.println('To JSON: '+JSON.to(" + object + ",true));" );
	}

	private static void fromJSON( String object, String debug )
	{
		run( base + "System.out.println('From JSON: '+JSON.from(JSON.to(" + object + "),true)" + debug + ");" );
	}

	private static void toFromJSON( String object )
	{
		run( base + "System.out.println('From JSON: '+JSON.to(JSON.from(JSON.to(" + object + "))));" );
	}

	private static void toBSON( String object, String debug )
	{
		run( base + "System.out.println('To BSON: '+BSON.to(" + object + ")." + debug + ");" );
	}

	private static void run( String script )
	{
		Context context = Context.enter();
		Scriptable scope = new ImporterTopLevel( context );
		context.initStandardObjects();
		context.evaluateString( scope, script, "<cmd>", 1, null );
	}
}
