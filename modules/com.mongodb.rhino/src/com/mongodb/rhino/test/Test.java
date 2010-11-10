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
		String array = "[1, 2, 3, {name:'MyChild'}, {$oid:'47cc67093475061e3d95369d'}, new Date()]";
		String object = "{name:'MyObject', children:" + array + ", id:{$oid:'47cc67093475061e3d95369d'}, more:{more:{more:'test'}}}";
		toJSON( array );
		toJSON( object );
		fromJSON( object, ".children[3].name" );
		fromJSON( object, ".children[5].toString()" );
		toFromJSON( object );
		toBSON( array, "get(4).getClass()" );
		toBSON( array, "get(5).getClass()" );
		toBSON( object, "get('children').getClass()" );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static final String base = "importClass(java.lang.System, com.mongodb.rhino.BSON, com.mongodb.rhino.JSON); ";

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
