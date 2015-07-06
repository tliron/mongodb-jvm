/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.rhino;

import org.bson.BsonReader;
import org.bson.BsonRegularExpression;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;

/**
 * A BSON codec for Rhino's NativeRegExp (the class is private in Rhino).
 * 
 * @author Tal Liron
 */
@SuppressWarnings("rawtypes")
public class NativeRegExpCodec implements Codec
{
	//
	// Codec
	//

	public Class getEncoderClass()
	{
		// This is not actually our encoded class, but we need some kind of
		// unique placeholder for BsonTypeClassMap
		return NativeRegExpCodec.class;
	}

	public void encode( BsonWriter writer, Object object, EncoderContext encoderContext )
	{
		Scriptable nativeRegExp = (Scriptable) object;

		Object source = nativeRegExp.get( "source", nativeRegExp );
		Object isGlobal = nativeRegExp.get( "global", nativeRegExp );
		Object isIgnoreCase = nativeRegExp.get( "ignoreCase", nativeRegExp );
		Object isMultiLine = nativeRegExp.get( "multiline", nativeRegExp );

		String options = "";
		if( ( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) )
			|| ( ( isGlobal instanceof Scriptable ) && ( (Boolean) ( (Scriptable) isGlobal ).getDefaultValue( Boolean.class ) ).booleanValue() ) )
			options += "g";
		if( ( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) )
			|| ( ( isIgnoreCase instanceof Scriptable ) && ( (Boolean) ( (Scriptable) isIgnoreCase ).getDefaultValue( Boolean.class ) ).booleanValue() ) )
			options += "i";
		if( ( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) )
			|| ( ( isMultiLine instanceof Scriptable ) && ( (Boolean) ( (Scriptable) isMultiLine ).getDefaultValue( Boolean.class ) ).booleanValue() ) )
			options += "m";

		writer.writeRegularExpression( new BsonRegularExpression( source.toString(), options ) );
	}

	public Object decode( BsonReader reader, DecoderContext decoderContext )
	{
		BsonRegularExpression bsonRegularExpression = reader.readRegularExpression();

		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newObject( scope, "RegExp", new Object[]
		{
			bsonRegularExpression.getPattern(), bsonRegularExpression.getOptions()
		} );
	}
}
