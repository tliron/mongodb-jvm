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
package com.mongodb.jvm.test;

import java.io.PrintWriter;

import jdk.nashorn.internal.runtime.Context;
import jdk.nashorn.internal.runtime.ErrorManager;
import jdk.nashorn.internal.runtime.ScriptFunction;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.ScriptRuntime;
import jdk.nashorn.internal.runtime.Source;
import jdk.nashorn.internal.runtime.options.Options;

/**
 * Test BSON and JSON conversion.
 * 
 * @author Tal Liron
 */
public class TestNashorn
{
	//
	// Main
	//

	public static void main( String[] arguments )
	{
		String array = "[1, 2, 3, {name:'MyChild'}, {$oid:'47cc67093475061e3d95369d'}, new Date(), {$ref: 'test', $id: '4d5595e3f7f2d14d2ab9630f'}, {$regex: 'myreg'}]";
		String object = "{name:'MyObject', children:" + array + ", id:{$oid:'47cc67093475061e3d95369d'}, more:{more:{more:'test'}}, regular:/[w.]+/gi, file:new java.io.File('/my-file/')}";
		toJSON( array );
		toJSON( object );
		fromJSON( object, ".children[3].name" );
		fromJSON( object, ".children[5]" );
		toFromJSON( object );
		toBSON( array, "[4].getClass()" );
		toBSON( array, "[5].getClass()" );
		toBSON( array, "[6]" );
		toBSON( object, "['children'].getClass()" );
		toBSON( object, "['regular']" );
		run( base + "x={name: {$regex: 'pattern'}};System.out.println(BSON.to(x));" );
		run( base + "x=JSON.from('[1,2,3]');x.push(4);System.out.println(x[3]);" );
		run( base + "x={s:'hello'};x.s += ' world';System.out.println(BSON.to(x));" );
		run( base + "x={id:1,y:[1,2,3]};System.out.println(BSON.fromJson(BSON.to(x).toJson()));" );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static final String base = "load('nashorn:mozilla_compat.js'); importClass(java.lang.System); BSON = org.bson.jvm.Bson; BSON.implementation = new org.bson.jvm.nashorn.NashornBsonImplementation(); JSON = com.threecrickets.jvm.json.Json; JSON.implementation = new com.mongodb.jvm.json.nashorn.NashornExtendedJsonImplementation(); JSON.implementation.initialize();";

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
		run( base + "System.out.println('To BSON: '+BSON.to({x: " + object + "}).x" + debug + ");" );
	}

	private static void run( String script )
	{
		PrintWriter out = new PrintWriter( System.out, true );
		PrintWriter err = new PrintWriter( System.err, true );
		Options options = new Options( "nashorn", err );
		options.set( "print.no.newline", true );
		ErrorManager errors = new ErrorManager( err );
		Context context = new Context( options, errors, out, err, Thread.currentThread().getContextClassLoader() );
		ScriptObject globalScope = context.createGlobal();
		Context.setGlobal( globalScope );
		ScriptFunction fn = context.compileScript( Source.sourceFor( TestNashorn.class.getCanonicalName(), script ), globalScope );
		ScriptRuntime.apply( fn, globalScope );
	}
}
